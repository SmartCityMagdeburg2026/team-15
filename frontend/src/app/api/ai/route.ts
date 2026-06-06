import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// ─── Config ───────────────────────────────────────────────────────────────────

const RAG_DOCS_ROOT =
  process.env.RAG_DOCS_PATH ||
  path.join(process.cwd(), "..", "..", "Datasources", "data", "rag");

const SERVER_URL = process.env.SERVER_URL;
const SERVER_TOKEN = process.env.SERVER_TOKEN;

const MAX_HITS = 5;
const CHUNK_SIZE = 400;
const CHUNK_OVERLAP = 50;
const RAG_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Elbe flood thresholds (cm) — official WSV values for Magdeburg-Strombrücke
const ELBE_THRESHOLDS = {
  normal: 400,
  elevated: 500,
  flood: 600,
};

// WHO 24h guidelines
const WHO_LIMITS = {
  pm25: 15,
  pm10: 45,
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface RagChunk {
  source: string;
  chunkIndex: number;
  text: string;
}

interface WeatherFacts {
  temperature: number;
  humidity: number;
  condition: string;
  windSpeed: number;
  city: string;
  timestamp: string;
}

interface AirQualityFacts {
  aqi: number;
  status: string;
  station: string;
  pm25?: number;
  pm10?: number;
  timestamp: string;
}

interface TransitDelay {
  line: string;
  delay: string;
  status: string;
}

interface TransitFacts {
  status: string;
  delays: TransitDelay[];
  timestamp: string;
}

interface WaterLevelFacts {
  value: number; // cm
  status: "normal" | "elevated" | "warning" | "flood";
  timestamp: string;
  trend?: "rising" | "falling" | "stable";
}

interface LiveFacts {
  weather?: WeatherFacts;
  airQuality?: AirQualityFacts;
  transit?: TransitFacts;
  waterLevel?: WaterLevelFacts;
  fetchErrors: string[];
}

// ─── RAG: load + cache ────────────────────────────────────────────────────────

let ragCache: { expiresAt: number; chunks: RagChunk[] } | null = null;

async function loadRagChunks(): Promise<RagChunk[]> {
  try {
    const stat = await fs.stat(RAG_DOCS_ROOT);
    if (!stat.isDirectory()) return [];
  } catch {
    return [];
  }

  const chunks: RagChunk[] = [];

  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "embedder" || entry.name === "snapshots") continue;
        await walk(fullPath);
        continue;
      }
      if (!entry.name.endsWith(".md") && !entry.name.endsWith(".txt")) continue;

      const rawText = await fs.readFile(fullPath, "utf8");
      const text = rawText.replace(/\r\n/g, "\n").trim();
      if (!text) continue;

      const words = text.split(/\s+/);
      let index = 0;
      let chunkIndex = 0;

      while (index < words.length) {
        const slice = words.slice(index, index + CHUNK_SIZE);
        const chunkText = slice.join(" ").trim();
        if (chunkText) {
          chunks.push({
            source: path.relative(process.cwd(), fullPath).replace(/\\/g, "/"),
            chunkIndex,
            text: chunkText,
          });
          chunkIndex++;
        }
        if (index + CHUNK_SIZE >= words.length) break;
        index += CHUNK_SIZE - CHUNK_OVERLAP;
      }
    }
  }

  await walk(RAG_DOCS_ROOT);
  return chunks;
}

async function getRagChunks(): Promise<RagChunk[]> {
  if (ragCache && ragCache.expiresAt > Date.now()) return ragCache.chunks;
  const chunks = await loadRagChunks();
  ragCache = { expiresAt: Date.now() + RAG_CACHE_TTL_MS, chunks };
  return chunks;
}

// ─── RAG: retrieval ───────────────────────────────────────────────────────────

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * Tokenizes a query including splitting German compound words.
 * e.g. "Wasserstand" → ["wasserstand", "wasser", "stand"]
 */
function tokenize(text: string): string[] {
  const normalized = normalizeText(text);
  const base = normalized.split(/\s+/).filter((w) => w.length >= 3);
  const expanded: string[] = [...base];

  for (const word of base) {
    if (word.length > 8) {
      // emit sub-strings to catch compound word components
      for (let i = 4; i < word.length - 3; i++) {
        const left = word.slice(0, i);
        const right = word.slice(i);
        if (left.length >= 4) expanded.push(left);
        if (right.length >= 4) expanded.push(right);
      }
    }
  }

  return Array.from(new Set(expanded));
}

function scoreChunk(queryTokens: string[], normalizedQuery: string, chunk: RagChunk): number {
  const chunkText = normalizeText(chunk.text);
  let score = 0;

  for (const token of queryTokens) {
    const count = chunkText.split(token).length - 1;
    if (count > 0) {
      score += count * 10;
      score += 2; // presence bonus
    }
  }

  // Exact phrase match — strong signal
  if (chunkText.includes(normalizedQuery)) score += 30;

  return score;
}

function searchRag(query: string, chunks: RagChunk[], k = MAX_HITS): RagChunk[] {
  if (!chunks.length) return [];
  const tokens = tokenize(query);
  const normalizedQuery = normalizeText(query);

  return chunks
    .map((chunk) => ({ chunk, score: scoreChunk(tokens, normalizedQuery, chunk) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(({ chunk }) => chunk);
}

// ─── Live data fetching ───────────────────────────────────────────────────────

async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function classifyWaterLevel(cm: number): WaterLevelFacts["status"] {
  if (cm >= ELBE_THRESHOLDS.flood) return "flood";
  if (cm >= ELBE_THRESHOLDS.elevated) return "warning";
  if (cm >= ELBE_THRESHOLDS.normal) return "elevated";
  return "normal";
}

async function getLiveFacts(request: Request): Promise<LiveFacts> {
  const origin = new URL(request.url).origin;
  const fetchErrors: string[] = [];

  const [weatherRaw, airRaw, transitRaw, waterRaw] = await Promise.all([
    safeFetch<Record<string, unknown>>(`${origin}/api/weather`),
    safeFetch<Record<string, unknown>>(`${origin}/api/air-quality`),
    safeFetch<Record<string, unknown>>(`${origin}/api/transit`),
    safeFetch<Record<string, unknown>>(`${origin}/api/water-level`),
  ]);

  const facts: LiveFacts = { fetchErrors };

  if (weatherRaw) {
    facts.weather = {
      temperature: Number(weatherRaw.temperature ?? weatherRaw.tempC ?? 0),
      humidity: Number(weatherRaw.humidity ?? 0),
      condition: String(weatherRaw.condition ?? "unbekannt"),
      windSpeed: Number(weatherRaw.windSpeed ?? weatherRaw.windSpeedKPH ?? 0),
      city: String(weatherRaw.city ?? "Magdeburg"),
      timestamp: String(weatherRaw.timestamp ?? new Date().toISOString()),
    };
  } else {
    fetchErrors.push("Wetterdaten");
  }

  if (airRaw) {
    facts.airQuality = {
      aqi: Number(airRaw.aqi ?? 0),
      status: String(airRaw.status ?? "unbekannt"),
      station: String(airRaw.station ?? "Magdeburg-Mitte"),
      pm25: airRaw.pm25 != null ? Number(airRaw.pm25) : undefined,
      pm10: airRaw.pm10 != null ? Number(airRaw.pm10) : undefined,
      timestamp: String(airRaw.timestamp ?? new Date().toISOString()),
    };
  } else {
    fetchErrors.push("Luftqualitätsdaten");
  }

  if (transitRaw) {
    facts.transit = {
      status: String(transitRaw.status ?? "unbekannt"),
      delays: Array.isArray(transitRaw.delays)
        ? (transitRaw.delays as Record<string, unknown>[]).slice(0, 6).map((d) => ({
            line: String(d.line ?? "?"),
            delay: String(d.delay ?? "?"),
            status: String(d.status ?? "?"),
          }))
        : [],
      timestamp: String(transitRaw.timestamp ?? new Date().toISOString()),
    };
  } else {
    fetchErrors.push("ÖPNV-Daten");
  }

  if (waterRaw) {
    const cm = Number(waterRaw.value ?? waterRaw.level ?? 0);
    facts.waterLevel = {
      value: cm,
      status: classifyWaterLevel(cm),
      timestamp: String(waterRaw.timestamp ?? new Date().toISOString()),
      trend: waterRaw.trend as WaterLevelFacts["trend"] | undefined,
    };
  } else {
    fetchErrors.push("Elbe-Pegelstand");
  }

  return facts;
}

// ─── Language detection ───────────────────────────────────────────────────────

function detectLang(question: string): "de" | "en" {
  const norm = normalizeText(question);
  const de = ["wie", "ist", "was", "welche", "wo", "wann", "warum", "gibt", "kannst", "bitte", "magdeburg"];
  const en = ["what", "how", "is", "are", "which", "where", "when", "why", "does", "can", "please"];
  const deScore = de.filter((w) => new RegExp(`\\b${w}\\b`).test(norm)).length;
  const enScore = en.filter((w) => new RegExp(`\\b${w}\\b`).test(norm)).length;
  return enScore >= deScore ? "en" : "de";
}

// ─── Prompt construction ──────────────────────────────────────────────────────

function buildSystemPrompt(lang: "de" | "en"): string {
  if (lang === "de") {
    return `Du bist Ask Otto, der freundliche Smart-City-Assistent für Magdeburg.

VERHALTEN:
- Antworte immer auf Deutsch, kurz und bürgerfreundlich (1–4 Sätze oder eine kurze Liste).
- Priorisiere: Live-Daten > Dokumentenquellen > Allgemeinwissen.
- Nenne niemals Dateipfade, Quellnamen, chunk-Indizes oder interne Bezeichnungen.
- Wenn Live-Daten vorhanden sind, nenne konkrete Zahlen (z. B. "18 °C", "PM2.5: 12 µg/m³").
- Gib immer eine Einschätzung: Ist der aktuelle Wert normal, erhöht oder kritisch?
- Wenn die Dokumente die Frage nicht beantworten, antworte trotzdem so gut du kannst aus deinem Wissen, ohne eine Quellenliste zu erstellen.
- Wenn Daten fehlen, sag das in einem kurzen Satz und antworte aus deinem Wissen weiter.
- Keine Floskeln wie "Natürlich!", "Gerne!", "Als KI…" — komm direkt zur Antwort.

SCHWELLENWERTE (zur Einschätzung):
- Elbe-Pegel Normal: <400 cm | Erhöht: 400–500 cm | Warnung: 500–600 cm | Hochwasser: >600 cm
- Luftqualität WHO-Grenzwerte: PM2.5 ≤15 µg/m³ | PM10 ≤45 µg/m³
- Temperaturanomalie: Werte >2 °C über dem langjährigen Mittel gelten als erhöht.`;
  }

  return `You are Ask Otto, the friendly Smart City assistant for Magdeburg, Germany.

BEHAVIOUR:
- Always respond in English, concisely and citizen-friendly (1–4 sentences or a short list).
- Priority order: live data > document sources > general knowledge.
- Never mention file paths, source names, chunk indices, or internal identifiers.
- When live data is available, cite specific numbers (e.g. "18 °C", "PM2.5: 12 µg/m³").
- Always give an interpretation: is the current value normal, elevated, or critical?
- If the documents do not answer the question, still answer with your best knowledge. Do not list documents or mention sources.
- If data is missing, say so briefly and continue with your best knowledge.
- No filler phrases like "Of course!", "Certainly!", "As an AI…" — get straight to the answer.

THRESHOLDS (for interpretation):
- Elbe level Normal: <400 cm | Elevated: 400–500 cm | Warning: 500–600 cm | Flood: >600 cm
- Air quality WHO limits: PM2.5 ≤${WHO_LIMITS.pm25} µg/m³ | PM10 ≤${WHO_LIMITS.pm10} µg/m³
- Temperature anomaly: values >2 °C above long-term average are considered elevated.`;
}

function buildUserTurn(
  question: string,
  hits: RagChunk[],
  facts: LiveFacts,
  lang: "de" | "en"
): string {
  const sections: string[] = [];

  // 1. Live data — high priority, structured clearly
  const hasLive = facts.weather || facts.airQuality || facts.transit || facts.waterLevel;
  if (hasLive) {
    sections.push(lang === "de" ? "## Aktuelle Live-Daten" : "## Current live data");

    if (facts.waterLevel) {
      const wl = facts.waterLevel;
      const statusLabel = {
        normal: lang === "de" ? "Normal ✅" : "Normal ✅",
        elevated: lang === "de" ? "Erhöht ⚠️" : "Elevated ⚠️",
        warning: lang === "de" ? "Warnung 🟡" : "Warning 🟡",
        flood: lang === "de" ? "HOCHWASSER 🔴" : "FLOOD WARNING 🔴",
      }[wl.status];
      const trend = wl.trend
        ? ` | Tendenz: ${wl.trend === "rising" ? "steigend ↑" : wl.trend === "falling" ? "fallend ↓" : "stabil →"}`
        : "";
      sections.push(`- Elbe-Pegel (Magdeburg-Strombrücke): ${wl.value} cm | Status: ${statusLabel}${trend}`);
    }

    if (facts.weather) {
      const w = facts.weather;
      sections.push(
        `- Wetter: ${w.temperature} °C, ${w.condition} | Luftfeuchtigkeit: ${w.humidity}% | Wind: ${w.windSpeed} km/h`
      );
    }

    if (facts.airQuality) {
      const aq = facts.airQuality;
      const pm25ok = aq.pm25 != null ? (aq.pm25 <= WHO_LIMITS.pm25 ? "✅" : "⚠️") : "";
      const pm10ok = aq.pm10 != null ? (aq.pm10 <= WHO_LIMITS.pm10 ? "✅" : "⚠️") : "";
      sections.push(
        `- Luftqualität: AQI ${aq.aqi} (${aq.status}) | ` +
          `PM2.5: ${aq.pm25 ?? "–"} µg/m³ ${pm25ok} | PM10: ${aq.pm10 ?? "–"} µg/m³ ${pm10ok}`
      );
    }

    if (facts.transit) {
      const t = facts.transit;
      const delayLines =
        t.delays.length > 0
          ? t.delays.map((d) => `  - Linie ${d.line}: ${d.delay} (${d.status})`).join("\n")
          : lang === "de"
          ? "  - Keine gemeldeten Verspätungen"
          : "  - No reported delays";
      sections.push(`- ÖPNV-Status: ${t.status}\n${delayLines}`);
    }

    if (facts.fetchErrors.length > 0) {
      sections.push(
        lang === "de"
          ? `⚠️ Nicht verfügbar: ${facts.fetchErrors.join(", ")}`
          : `⚠️ Unavailable: ${facts.fetchErrors.join(", ")}`
      );
    }
  } else {
    sections.push(
      lang === "de"
        ? "## Live-Daten\nℹ️ Keine Live-Daten verfügbar – Antwort basiert auf Dokumentenquellen und Allgemeinwissen."
        : "## Live data\nℹ️ No live data available – answer based on document sources and general knowledge."
    );
  }

  // 2. Background knowledge from RAG
  if (hits.length > 0) {
    sections.push(lang === "de" ? "## Hintergrundwissen aus Dokumenten" : "## Background knowledge from documents");
    hits.forEach((hit, i) => {
      sections.push(`[${i + 1}] ${hit.text.replace(/\s+/g, " ").trim()}`);
    });
  }

  // 3. The question — last, freshest in context window
  sections.push(lang === "de" ? `## Frage\n${question}` : `## Question\n${question}`);

  return sections.join("\n\n");
}

// ─── WatsonX call ─────────────────────────────────────────────────────────────

async function askWatsonX(systemPrompt: string, userTurn: string): Promise<string> {
  if (!SERVER_URL || !SERVER_TOKEN) {
    throw new Error("SERVER_URL oder SERVER_TOKEN ist nicht konfiguriert.");
  }

  const url = `${SERVER_URL.replace(/\/+$/, "")}/api/llm/chat`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVER_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userTurn },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WatsonX Fehler: ${response.status} — ${errorText}`);
  }

  const data = await response.json();
  const reply = String(data.response ?? data.result ?? data.answer ?? data.message ?? "").trim();

  if (!reply) {
    throw new Error("WatsonX hat eine leere Antwort zurückgegeben.");
  }

  return reply;
}

// ─── Route handlers ───────────────────────────────────────────────────────────

export async function GET() {
  const chunkCount = (await getRagChunks()).length;
  return NextResponse.json({
    status: "online",
    botName: "Ask Otto",
    description: "Ask Otto — Magdeburg Smart City Assistant (RAG + Live-Daten)",
    ragDocsPath: RAG_DOCS_ROOT,
    ragChunksLoaded: chunkCount,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userMessage = String(body.message ?? "").trim();

    if (!userMessage) {
      return NextResponse.json(
        { error: "Das Feld 'message' darf nicht leer sein." },
        { status: 400 }
      );
    }

    const lang = detectLang(userMessage);

    // Fetch RAG chunks and live data in parallel
    const [chunks, facts] = await Promise.all([getRagChunks(), getLiveFacts(request)]);
    const hits = searchRag(userMessage, chunks, MAX_HITS);

    const systemPrompt = buildSystemPrompt(lang);
    const userTurn = buildUserTurn(userMessage, hits, facts, lang);
    const reply = await askWatsonX(systemPrompt, userTurn);

    return NextResponse.json({
      reply,
      lang,
      sources: hits.map((h) => ({ source: h.source, chunkIndex: h.chunkIndex })),
      liveFacts: facts,
      ragHits: hits.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    console.error("[Ask Otto] POST error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}