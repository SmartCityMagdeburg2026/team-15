"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import type { EnvironmentState } from "./types";
import { environmentSeed } from "./seed";
import {
  freshnessLabel,
  environmentMeaning,
  airScore,
  comfortScore,
  greenScore,
  overallEnvironmentScore,
  environmentSummary,
  clampScore,
} from "./utils";

// Dynamically import the map — Leaflet is browser-only
const EnvironmentMap = dynamic(() => import("./EnvironmentMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-green-50/30 rounded-xl">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-[#16a34a] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-zinc-400 font-semibold">Loading map…</span>
      </div>
    </div>
  ),
});

// ── Icons ──────────────────────────────────────────────────────────────────

const LeafIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M12 3a9 9 0 0 0-9 9c0 4.97 4.03 9 9 9s9-4.03 9-9a9 9 0 0 0-9-9z" />
    <path d="M12 3v18" />
    <path d="M12 12c2-2 5-2 5-2s0 3-2 5" />
    <path d="M12 12c-2-2-5-2-5-2s0 3 2 5" />
  </svg>
);

const WindIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
    <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
    <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
  </svg>
);

const TreeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M12 22V12" />
    <path d="M12 12 8 8" />
    <path d="M12 12l4-4" />
    <path d="M4 16l8-8 8 8" />
    <path d="M2 20l10-10 10 10" />
  </svg>
);

const InfoIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
  </svg>
);

const NoteIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2" />
  </svg>
);

const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// ── Colour helpers ─────────────────────────────────────────────────────────

function airColors(label: string) {
  if (label === "Good")  return { text: "text-[#16a34a]", bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600 bg-emerald-100" };
  if (label === "Fair")  return { text: "text-amber-400",  bg: "bg-amber-50",   border: "border-amber-200",   icon: "text-amber-400 bg-amber-100" };
  return                        { text: "text-rose-400",   bg: "bg-rose-50",    border: "border-rose-200",    icon: "text-rose-400 bg-rose-100" };
}

function comfortColors(label: string) {
  if (label === "Comfortable") return { text: "text-[#0c6b5b]", bg: "bg-teal-50",   border: "border-teal-200",   icon: "text-teal-600 bg-teal-100" };
  if (label === "Mixed")       return { text: "text-amber-400",  bg: "bg-amber-50",  border: "border-amber-200",  icon: "text-amber-400 bg-amber-100" };
  return                              { text: "text-rose-400",   bg: "bg-rose-50",   border: "border-rose-200",   icon: "text-rose-400 bg-rose-100" };
}

function greenColors(label: string) {
  if (label === "Strong")   return { text: "text-[#15803d]", bg: "bg-green-50",  border: "border-green-200",  icon: "text-green-600 bg-green-100" };
  if (label === "Moderate") return { text: "text-[#0c6b5b]", bg: "bg-teal-50",   border: "border-teal-200",   icon: "text-teal-600 bg-teal-100" };
  return                           { text: "text-amber-400",  bg: "bg-amber-50",  border: "border-amber-200",  icon: "text-amber-400 bg-amber-100" };
}

function summaryBadgeColor(score: number) {
  if (score >= 80) return { ring: "bg-[#16a34a]", text: "text-[#16a34a]", bg: "bg-emerald-50 border-emerald-200" };
  if (score >= 65) return { ring: "bg-amber-400",  text: "text-amber-700",  bg: "bg-amber-50 border-amber-200" };
  if (score >= 50) return { ring: "bg-orange-400", text: "text-orange-700", bg: "bg-orange-50 border-orange-200" };
  return                  { ring: "bg-rose-400",   text: "text-rose-700",   bg: "bg-rose-50 border-rose-200" };
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function EnvironmentScreen() {
  const [data, setData] = useState<EnvironmentState>(environmentSeed);

  const freshness = freshnessLabel(data.freshness);
  const showInsights = data.freshness.state === "live";
  const meanings = environmentMeaning(data.overallScore, data.recommendation);
  const badge = summaryBadgeColor(data.overallScore);

  // Attempt to hydrate from live APIs (non-blocking): air quality + comfort + green access
  useEffect(() => {
    async function tryLiveData() {
      let newAirLabel: EnvironmentState["airQuality"]["label"] = environmentSeed.airQuality.label;
      let newAirScore = environmentSeed.airQuality.score;
      let newAirDisplay = environmentSeed.airQuality.displayValue;
      let newAirHelper = environmentSeed.airQuality.helper;
      let newComfortLabel: EnvironmentState["urbanComfort"]["label"] = environmentSeed.urbanComfort.label;
      let newComfortDisplay = environmentSeed.urbanComfort.displayValue;
      let newComfortHelper = environmentSeed.urbanComfort.helper;
      let newGreenLabel: EnvironmentState["greenAccess"]["label"] = environmentSeed.greenAccess.label;
      let newGreenScore = environmentSeed.greenAccess.score;
      let newGreenDisplay = environmentSeed.greenAccess.displayValue;
      let newGreenHelper = environmentSeed.greenAccess.helper;
      let gotLive = false;

      // 1. Air quality — Open-Meteo Air Quality API
      try {
        const res = await fetch(
          "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=52.1205&longitude=11.6276&current=european_aqi,pm2_5,pm10"
        );
        if (res.ok) {
          const json = await res.json();
          const aqiRaw: number = json?.current?.european_aqi ?? -1;
          if (aqiRaw >= 0) {
            if (aqiRaw <= 20) {
              newAirLabel = "Good";
              newAirDisplay = "Good air conditions";
              newAirHelper = "Air conditions are suitable for most outdoor activity.";
            } else if (aqiRaw <= 40) {
              newAirLabel = "Fair";
              newAirDisplay = "Mostly acceptable air";
              newAirHelper = "Air conditions are acceptable, though some spots may feel less fresh.";
            } else {
              newAirLabel = "Poor";
              newAirDisplay = "Weaker air quality";
              newAirHelper = "Air quality is weaker today in some parts of the city.";
            }
            newAirScore = clampScore(100 - aqiRaw);
            gotLive = true;
          }
        }
      } catch { /* silent — seed values remain */ }

      // 2. Urban comfort — Open-Meteo Forecast API
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=52.1205&longitude=11.6276&current=temperature_2m,apparent_temperature,wind_speed_10m,precipitation"
        );
        if (res.ok) {
          const json = await res.json();
          const apparent: number = json?.current?.apparent_temperature ?? 999;
          const wind: number     = json?.current?.wind_speed_10m ?? 0;
          const precip: number   = json?.current?.precipitation ?? 0;

          if (apparent !== 999) {
            if (apparent <= 25 && wind <= 30 && precip < 0.5) {
              newComfortLabel   = "Comfortable";
              newComfortDisplay = apparent <= 20 ? "Mild outdoors" : "Warm midday";
              newComfortHelper  = "Outdoor conditions feel comfortable for walking and everyday time outside.";
            } else if (apparent <= 30 && wind <= 45) {
              newComfortLabel   = "Mixed";
              newComfortDisplay = apparent > 27 ? "Warm midday" : "Breezy conditions";
              newComfortHelper  = "Conditions are manageable, though sunnier or exposed areas may feel warmer.";
            } else {
              newComfortLabel   = "Stressed";
              newComfortDisplay = wind > 45 ? "Windy & exposed" : "Heat building";
              newComfortHelper  = "Heat or exposure may make outdoor conditions less comfortable today.";
            }
            gotLive = true;
          }
        }
      } catch { /* silent — seed values remain */ }

      // 3. Green access — Overpass API (count parks/gardens/woods in Magdeburg bounds)
      try {
        const query = `[out:json][timeout:10];(way["leisure"="park"](52.09,11.58,52.16,11.72);way["leisure"="garden"](52.09,11.58,52.16,11.72);way["natural"="wood"](52.09,11.58,52.16,11.72););out count;`;
        const res = await fetch(
          `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
        );
        if (res.ok) {
          const json = await res.json();
          const parkCount: number = json?.elements?.[0]?.tags?.total ?? -1;
          if (parkCount >= 0) {
            if (parkCount >= 30) {
              newGreenLabel   = "Strong";
              newGreenDisplay = "Abundant green access";
              newGreenHelper  = "Excellent access to parks and green corridors across the city.";
              newGreenScore   = greenScore("Strong");
            } else if (parkCount >= 12) {
              newGreenLabel   = "Moderate";
              newGreenDisplay = "Nearby in many districts";
              newGreenHelper  = "Green access is decent overall, though not equally distributed.";
              newGreenScore   = greenScore("Moderate");
            } else {
              newGreenLabel   = "Uneven";
              newGreenDisplay = "Limited in some areas";
              newGreenHelper  = "Green spaces are unevenly spread — some districts have better access than others.";
              newGreenScore   = greenScore("Uneven");
            }
            gotLive = true;
          }
        }
      } catch { /* silent — seed values remain */ }

      if (gotLive) {
        const air     = airScore(newAirLabel, newAirScore);
        const comfort = comfortScore(newComfortLabel);
        const green   = greenScore(newGreenLabel);
        const overall = overallEnvironmentScore({ air, comfort, green });
        const summary = environmentSummary(overall);

        // Dynamic notes from live data
        const liveNotes: string[] = [
          newAirLabel === "Good"
            ? "Air feels fresh across most of the city today."
            : newAirLabel === "Fair"
            ? "Air quality is acceptable but fresher away from busier central corridors."
            : "Air quality is weaker today — prefer ventilated or outdoor green areas.",
          newComfortLabel === "Comfortable"
            ? "Outdoor conditions are pleasant — a good day for walks and park visits."
            : newComfortLabel === "Mixed"
            ? "Greener and shaded areas may feel more comfortable around midday."
            : "Heat or wind may make exposed areas less comfortable — seek shade.",
          newGreenLabel === "Strong"
            ? "Excellent park access today across Magdeburg — Rotehorn and Elbauenpark ideal."
            : newGreenLabel === "Moderate"
            ? "Access to parks is stronger in some districts than others."
            : "Some districts have limited green access — Rotehorn remains a good option.",
        ];

        // Dynamic recommendation
        const recommendation =
          overall >= 80
            ? "Best for: outdoor walks, cycling, and time in parks."
            : overall >= 65
            ? "Best for: short walks and time in greener areas."
            : "Best for: indoor or shaded areas during peak outdoor hours.";

        setData((prev) => ({
          ...prev,
          freshness: {
            state: "live",
            updatedAt: new Date().toISOString(),
            label: "Updated just now",
          },
          summary,
          overallScore: overall,
          airQuality: {
            label: newAirLabel,
            score: air,
            displayValue: newAirDisplay,
            helper: newAirHelper,
          },
          urbanComfort: {
            label: newComfortLabel,
            score: comfort,
            displayValue: newComfortDisplay,
            helper: newComfortHelper,
          },
          greenAccess: {
            label: newGreenLabel,
            score: newGreenScore,
            displayValue: newGreenDisplay,
            helper: newGreenHelper,
          },
          notes: liveNotes,
          recommendation,
        }));
      }
    }

    tryLiveData();
  }, [data.greenAccess.label]);

  const ac = airColors(data.airQuality.label);
  const cc = comfortColors(data.urbanComfort.label);
  const gc = greenColors(data.greenAccess.label);

  return (
    <div className="space-y-6 animate-fadeIn text-left">

      {/* ── 1. Page Heading Block ────────────────────────────────────────── */}
      <div className="pb-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#16a34a] mb-1">City pulse</p>
        <h1 className="text-[28px] sm:text-[34px] font-black tracking-tight text-[#0a2540] leading-none">
          Environment
        </h1>
        <p className="text-sm text-zinc-500 font-semibold mt-2">
          How healthy and comfortable does Magdeburg feel today?
        </p>
      </div>

      {/* ── 2. Summary Sentence + 3. Freshness ──────────────────────────── */}
      <div className={`flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5 rounded-2xl border ${badge.bg}`}>
        <div className={`flex-shrink-0 w-7 h-7 rounded-full ${badge.ring} flex items-center justify-center`}>
          <CheckIcon className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[15px] sm:text-[16px] font-black leading-snug ${badge.text}`}>
            {data.summary}
          </p>
        </div>
        <span className="flex-shrink-0 text-[10px] font-bold text-zinc-400 bg-white border border-zinc-200 px-2.5 py-1 rounded-lg whitespace-nowrap">
          {freshness}
        </span>
      </div>

      {/* ── 4. Three Metric Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Card A — Air quality */}
        <div className={`bg-white border ${ac.border} rounded-2xl p-5 shadow-xs flex flex-col gap-3 hover:shadow-md transition-shadow`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${ac.icon}`}>
              <LeafIcon className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wide">Air quality</span>
          </div>
          <div>
            <div className={`text-[28px] font-black leading-none ${ac.text}`}>{data.airQuality.label}</div>
            <p className="text-xs text-zinc-500 font-semibold mt-1.5 leading-snug">
              {data.airQuality.helper}
            </p>
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-3">
            <span className="text-[11px] text-zinc-400 font-semibold">Conditions today</span>
            <span className={`text-[13px] font-black ${ac.text}`}>{data.airQuality.displayValue}</span>
          </div>
        </div>

        {/* Card B — Urban comfort */}
        <div className={`bg-white border ${cc.border} rounded-2xl p-5 shadow-xs flex flex-col gap-3 hover:shadow-md transition-shadow`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${cc.icon}`}>
              <WindIcon className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wide">Urban comfort</span>
          </div>
          <div>
            <div className={`text-[28px] font-black leading-none ${cc.text}`}>{data.urbanComfort.label}</div>
            <p className="text-xs text-zinc-500 font-semibold mt-1.5 leading-snug">
              {data.urbanComfort.helper}
            </p>
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-3">
            <span className="text-[11px] text-zinc-400 font-semibold">Outdoor feel</span>
            <span className={`text-[13px] font-black ${cc.text}`}>{data.urbanComfort.displayValue}</span>
          </div>
        </div>

        {/* Card C — Green access */}
        <div className={`bg-white border ${gc.border} rounded-2xl p-5 shadow-xs flex flex-col gap-3 hover:shadow-md transition-shadow`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${gc.icon}`}>
              <TreeIcon className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wide">Green access</span>
          </div>
          <div>
            <div className={`text-[28px] font-black leading-none ${gc.text}`}>{data.greenAccess.label}</div>
            <p className="text-xs text-zinc-500 font-semibold mt-1.5 leading-snug">
              {data.greenAccess.helper}
            </p>
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-3">
            <span className="text-[11px] text-zinc-400 font-semibold">Park proximity</span>
            <span className={`text-[13px] font-black ${gc.text}`}>{data.greenAccess.displayValue}</span>
          </div>
        </div>

      </div>

      {/* ── 5. Environment Map Card ──────────────────────────────────────── */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-black text-[#0a2540]">Environmental context map</h2>
            <p className="text-[11px] text-zinc-400 font-semibold mt-0.5">Green spaces, cooler corridors and exposed zones across Magdeburg.</p>
          </div>
        </div>
        <div className="relative" style={{ height: "340px" }}>
          <EnvironmentMap />

          {/* North indicator */}
          <div className="absolute top-3 right-3 z-[999] bg-white border border-zinc-200 rounded-lg w-8 h-8 flex flex-col items-center justify-center shadow-sm">
            <span className="text-[8px] font-black text-zinc-800 leading-none">N</span>
            <span className="text-[10px] leading-none mt-0.5">↑</span>
          </div>
        </div>

        {/* Legend */}
        <div className="px-5 py-3 border-t border-zinc-100 flex flex-wrap items-center gap-x-5 gap-y-2">
          <LegendItem color="#22c55e" label="Green spaces" type="circle" />
          <LegendItem color="#0ea5e9" label="Cooler corridor" type="line" />
          <LegendItem color="#16a34a" label="Park corridor" type="line" />
          <LegendItem color="#f97316" label="Warmer / exposed zone" type="marker" />
        </div>
      </div>

      {showInsights && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── 6. What this means today ─────────────────────────────────── */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
              <span className="w-6 h-6 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-500">
                <InfoIcon className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-[13px] font-black text-[#0a2540]">What this means today</h3>
            </div>
            <ul className="space-y-2.5">
              {meanings.map((line, i) => (
                <li key={i} className="flex gap-2.5 items-start">
                  <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-[#16a34a] flex items-center justify-center">
                    <CheckIcon className="w-2.5 h-2.5 text-white" />
                  </span>
                  <span className="text-xs text-zinc-600 font-semibold leading-snug">{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── 8. Local notes card ──────────────────────────────────────── */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
              <span className="w-6 h-6 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-500">
                <NoteIcon className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-[13px] font-black text-[#0a2540]">Local notes</h3>
            </div>
            <div className="divide-y divide-zinc-100">
              {data.notes.map((note, i) => (
                <div key={i} className="py-3 first:pt-0 last:pb-0 flex gap-3 items-start">
                  <span className={`flex-shrink-0 mt-1 w-2 h-2 rounded-full ${i === 0 ? "bg-[#16a34a]" : i === 1 ? "bg-amber-400" : "bg-[#0c6b5b]"}`} />
                  <p className="text-[11px] text-zinc-600 font-semibold leading-snug">{note}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ── 9. Footer Principles Strip ───────────────────────────────────── */}
      <div className="border-t border-zinc-100 pt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: "🌿", title: "Nature-aware",    desc: "Decisions grounded in environmental data." },
          { icon: "🔓", title: "Open data",        desc: "Transparent sources and clear methods." },
          { icon: "👥", title: "For everyone",     desc: "Accessible insights for all citizens." },
          { icon: "🤝", title: "Better together",  desc: "A city that listens and improves." },
        ].map((p) => (
          <div key={p.title} className="flex items-start gap-2.5">
            <span className="text-base mt-0.5">{p.icon}</span>
            <div>
              <div className="text-[11px] font-black text-zinc-700">{p.title}</div>
              <div className="text-[10px] text-zinc-400 font-semibold leading-snug mt-0.5">{p.desc}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

// ── Legend helper ──────────────────────────────────────────────────────────

function LegendItem({ color, label, type }: {
  color: string;
  label: string;
  type: "line" | "circle" | "marker";
}) {
  return (
    <div className="flex items-center gap-1.5">
      {type === "marker" ? (
        <span className="text-[13px]">🌡</span>
      ) : type === "circle" ? (
        <span
          className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm flex-shrink-0"
          style={{ background: color, opacity: 0.7 }}
        />
      ) : (
        <svg width="18" height="8" viewBox="0 0 18 8" className="flex-shrink-0">
          <line x1="0" y1="4" x2="18" y2="4" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}
      <span className="text-[10px] text-zinc-500 font-semibold">{label}</span>
    </div>
  );
}
