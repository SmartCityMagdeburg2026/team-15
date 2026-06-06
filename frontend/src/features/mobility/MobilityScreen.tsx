"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import type { MobilityState } from "./types";
import { mobilitySeed } from "./seed";
import {
  freshnessLabel,
  mobilityMeaning,
  mobilitySummary,
} from "./utils";

// Dynamically import the map so it never SSR-renders (Leaflet is browser-only)
const MobilityMap = dynamic(() => import("./MobilityMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-zinc-50 rounded-xl">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-[#0c6b5b] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-zinc-400 font-semibold">Loading map…</span>
      </div>
    </div>
  ),
});

// ── Icons ──────────────────────────────────────────────────────────────────

const BusIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
    <rect x="3" y="6" width="18" height="11" rx="2" />
    <path d="M5 17v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2" />
    <path d="M16 17v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2" />
    <circle cx="7.5" cy="12" r="1" fill="currentColor" />
    <circle cx="16.5" cy="12" r="1" fill="currentColor" />
    <path d="M3 10h18" />
  </svg>
);

const WarningTriangle = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2L1 21h22L12 2zm1 14h-2v-2h2v2zm0-4h-2V8h2v4z" />
  </svg>
);

const BikeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
    <circle cx="6" cy="15" r="4" />
    <circle cx="18" cy="15" r="4" />
    <path d="M6 15l4-8 2 4h4M14 7h3" strokeLinecap="round" strokeLinejoin="round" />
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

// ── Status colour helpers ─────────────────────────────────────────────────

function transitColors(label: string) {
  if (label === "Good") return { text: "text-[#0c6b5b]", bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600 bg-emerald-100" };
  if (label === "Moderate") return { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600 bg-amber-100" };
  return { text: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", icon: "text-rose-600 bg-rose-100" };
}

function disruptionColors(label: string) {
  if (label === "Low") return { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600 bg-amber-100" };
  if (label === "Moderate") return { text: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", icon: "text-orange-600 bg-orange-100" };
  return { text: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", icon: "text-rose-600 bg-rose-100" };
}

function comfortColors(label: string) {
  if (label === "Good") return { text: "text-[#0c6b5b]", bg: "bg-teal-50", border: "border-teal-200", icon: "text-teal-600 bg-teal-100" };
  if (label === "Fair") return { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600 bg-amber-100" };
  return { text: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", icon: "text-rose-600 bg-rose-100" };
}

function noteDot(color: string) {
  if (color === "green") return "bg-[#10b981]";
  if (color === "amber") return "bg-amber-400";
  return "bg-[#0c6b5b]";
}

// ── Summary badge colour ──────────────────────────────────────────────────

function summaryBadgeColor(score: number) {
  if (score >= 80) return { ring: "bg-[#0c6b5b]", text: "text-[#0c6b5b]", bg: "bg-emerald-50 border-emerald-200" };
  if (score >= 65) return { ring: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50 border-amber-200" };
  if (score >= 50) return { ring: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50 border-orange-200" };
  return { ring: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50 border-rose-200" };
}

// ── Main Component ────────────────────────────────────────────────────────

export default function MobilityScreen() {
  const [data, setData] = useState<MobilityState>(mobilitySeed);

  const freshness = freshnessLabel(data.freshness);
  const meanings = mobilityMeaning(data.overallScore, data.recommendation);
  const badge = summaryBadgeColor(data.overallScore);
  const showInsights = data.freshness.state === "live";

  // Hydrate all metrics from live transit API
  useEffect(() => {
    async function tryLiveData() {
      try {
        const res = await fetch("/api/transit");
        if (!res.ok) return;
        const json = await res.json();

        const delays: { line: string; route?: string; delay: string; status: string }[] =
          json.delays ?? [];
        const delayCount: number = json.delayCount ?? delays.filter((d) => d.delay !== "0 min").length;
        const totalLines: number = json.totalLines ?? delays.length;
        const onTime = totalLines - delayCount;
        const transitScoreRaw: number = json.transitScore ?? (totalLines > 0 ? Math.round((onTime / totalLines) * 100) : 90);

        // ── transitFlow ─────────────────────────────────────
        const transitLabel: MobilityState["transitFlow"]["label"] =
          transitScoreRaw >= 80 ? "Good" : transitScoreRaw >= 60 ? "Moderate" : "Poor";
        const transitHelper =
          transitLabel === "Good"
            ? "Buses and trams are running frequently with few delays."
            : transitLabel === "Moderate"
            ? "Several lines are running with minor delays — allow extra time."
            : "Significant delays across multiple lines. Check MVB app for updates.";

        // ── disruptionLevel ──────────────────────────────────
        const disruptionLabel: MobilityState["disruptionLevel"]["label"] =
          delayCount === 0 ? "Low" : delayCount <= 3 ? "Low" : delayCount <= 6 ? "Moderate" : "High";
        const disruptionHelper =
          delayCount === 0
            ? "No disruptions reported right now. Everything is running smoothly."
            : delayCount <= 3
            ? `${delayCount} minor issue${delayCount > 1 ? "s" : ""}. No major disruptions right now.`
            : delayCount <= 6
            ? `${delayCount} lines affected. Plan for some delays in parts of the city.`
            : `${delayCount} lines experiencing delays. Significant disruptions across the network.`;
        const disruptionScore = disruptionLabel === "Low" ? 80 : disruptionLabel === "Moderate" ? 55 : 25;

        // ── movingComfort (inferred from delay severity) ─────
        const avgDelay = delays.reduce((sum, d) => sum + parseInt(d.delay), 0) / (delays.length || 1);
        const comfortLabel: MobilityState["movingComfort"]["label"] =
          avgDelay <= 1.5 ? "Good" : avgDelay <= 4 ? "Fair" : "Limited";
        const comfortDisplay = comfortLabel === "Good" ? "Light traffic" : comfortLabel === "Fair" ? "Some congestion" : "Heavy congestion";
        const comfortHelper =
          comfortLabel === "Good"
            ? "Roads are clear and public spaces feel comfortable."
            : comfortLabel === "Fair"
            ? "Some routes are experiencing slowdowns — allow a bit more time."
            : "Traffic and delays are making movement noticeably harder today.";
        const comfortScoreVal = comfortLabel === "Good" ? 85 : comfortLabel === "Fair" ? 60 : 35;

        // ── overallScore ─────────────────────────────────────
        const overallScore = 0.5 * transitScoreRaw + 0.3 * disruptionScore + 0.2 * comfortScoreVal;

        // ── recommendation ───────────────────────────────────
        const recommendation =
          overallScore >= 80
            ? "Best for: short city trips and cycling."
            : overallScore >= 65
            ? "Best for: using tram lines — avoid busier bus routes."
            : "Best for: flexible routes — check MVB app before travelling.";

        // ── notes from live delays ───────────────────────────
        const liveNotes: MobilityState["notes"] = [];
        const delayed = delays.filter((d) => d.delay !== "0 min").sort(
          (a, b) => parseInt(b.delay) - parseInt(a.delay)
        );
        for (const d of delayed.slice(0, 3)) {
          const mins = parseInt(d.delay);
          liveNotes.push({
            text: `${d.line} — ${mins} min delay${d.route ? ` on ${d.route}` : ""}.`,
            time: new Date().toTimeString().slice(0, 5),
            color: mins >= 7 ? "amber" : "teal",
          });
        }
        if (liveNotes.length === 0) {
          liveNotes.push({
            text: "All MVB lines are running on schedule.",
            time: new Date().toTimeString().slice(0, 5),
            color: "green",
          });
        }
        // Always add Elbe bridge note
        liveNotes.push({
          text: "Elbbrücke clear — No restrictions on the Elbe bridge.",
          time: new Date().toTimeString().slice(0, 5),
          color: "green",
        });

        setData({
          freshness: {
            state: "live",
            updatedAt: json.timestamp ?? new Date().toISOString(),
            label: "Live from MVB network",
          },
          summary: mobilitySummary(overallScore),
          overallScore,
          transitFlow: {
            label: transitLabel,
            score: transitScoreRaw,
            displayValue: `${transitScoreRaw}%`,
            helper: transitHelper,
          },
          disruptionLevel: {
            label: disruptionLabel,
            active: delayCount,
            score: disruptionScore,
            helper: disruptionHelper,
          },
          movingComfort: {
            label: comfortLabel,
            score: comfortScoreVal,
            displayValue: comfortDisplay,
            helper: comfortHelper,
          },
          notes: liveNotes,
          recommendation,
          prompts: mobilitySeed.prompts,
        });
      } catch {
        // Silent fallback — seeded data already displayed
      }
    }
    tryLiveData();
  }, []);

  const tc = transitColors(data.transitFlow.label);
  const dc = disruptionColors(data.disruptionLevel.label);
  const cc = comfortColors(data.movingComfort.label);

  return (
    <div className="space-y-6 animate-fadeIn text-left">

      {/* ── 1. Page Heading Block ───────────────────────────────────── */}
      <div className="pb-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#0c6b5b] mb-1">City pulse</p>
        <h1 className="text-[28px] sm:text-[34px] font-black tracking-tight text-[#0a2540] leading-none">
          Mobility
        </h1>
        <p className="text-sm text-zinc-500 font-semibold mt-2">
          How easy is it to get around Magdeburg today?
        </p>
      </div>

      {/* ── 2. Summary Sentence + 3. Freshness ─────────────────────── */}
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

      {/* ── 4. Three Metric Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Card A — Transit flow */}
        <div className={`bg-white border ${tc.border} rounded-2xl p-5 shadow-xs flex flex-col gap-3 hover:shadow-md transition-shadow`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${tc.icon}`}>
              <BusIcon className="w-4.5 h-4.5" />
            </span>
            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wide">Transit flow</span>
          </div>
          <div>
            <div className={`text-[28px] font-black leading-none ${tc.text}`}>{data.transitFlow.label}</div>
            <p className="text-xs text-zinc-500 font-semibold mt-1.5 leading-snug">
              {data.transitFlow.helper}
            </p>
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-3">
            <span className="text-[11px] text-zinc-400 font-semibold">On time performance</span>
            <span className={`text-[13px] font-black ${tc.text}`}>{data.transitFlow.displayValue}</span>
          </div>
        </div>

        {/* Card B — Disruption level */}
        <div className={`bg-white border ${dc.border} rounded-2xl p-5 shadow-xs flex flex-col gap-3 hover:shadow-md transition-shadow`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${dc.icon}`}>
              <WarningTriangle className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wide">Disruption level</span>
          </div>
          <div>
            <div className={`text-[28px] font-black leading-none ${dc.text}`}>{data.disruptionLevel.label}</div>
            <p className="text-xs text-zinc-500 font-semibold mt-1.5 leading-snug">
              {data.disruptionLevel.helper}
            </p>
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-3">
            <span className="text-[11px] text-zinc-400 font-semibold">Active disruptions</span>
            <span className={`text-[13px] font-black ${dc.text}`}>{data.disruptionLevel.active}</span>
          </div>
        </div>

        {/* Card C — Moving comfort */}
        <div className={`bg-white border ${cc.border} rounded-2xl p-5 shadow-xs flex flex-col gap-3 hover:shadow-md transition-shadow`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${cc.icon}`}>
              <BikeIcon className="w-4.5 h-4.5" />
            </span>
            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wide">Moving comfort</span>
          </div>
          <div>
            <div className={`text-[28px] font-black leading-none ${cc.text}`}>{data.movingComfort.label}</div>
            <p className="text-xs text-zinc-500 font-semibold mt-1.5 leading-snug">
              {data.movingComfort.helper}
            </p>
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-3">
            <span className="text-[11px] text-zinc-400 font-semibold">Traffic conditions</span>
            <span className={`text-[13px] font-black ${cc.text}`}>{data.movingComfort.displayValue}</span>
          </div>
        </div>
      </div>

      {/* ── 5. Map Card ─────────────────────────────────────────────── */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Map area */}
        <div className="relative" style={{ height: "320px" }}>
          <MobilityMap />

          {/* North indicator */}
          <div className="absolute top-3 right-3 z-[999] bg-white border border-zinc-200 rounded-lg w-8 h-8 flex flex-col items-center justify-center shadow-sm">
            <span className="text-[8px] font-black text-zinc-800 leading-none">N</span>
            <span className="text-[10px] leading-none mt-0.5">↑</span>
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 py-3 border-t border-zinc-100 flex flex-wrap items-center gap-x-5 gap-y-1.5">
          <LegendItem color="#10b981" label="Good flow" type="line" />
          <LegendItem color="#f97316" label="Slower than usual" type="line" />
          <LegendItem color="#94a3b8" label="No data" type="line" />
          <LegendItem color="#f97316" label="Disruption" type="marker" />
          <LegendItem color="transparent" label="District boundary" type="dashed" />
        </div>
      </div>

      {showInsights && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── 6. What this means today ─────────────────────────────── */}
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
                <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-[#0c6b5b] flex items-center justify-center">
                  <CheckIcon className="w-2.5 h-2.5 text-white" />
                </span>
                <span className="text-xs text-zinc-600 font-semibold leading-snug">{line}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── 8. Local notes card ──────────────────────────────────── */}
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
                <span className={`flex-shrink-0 mt-1 w-2 h-2 rounded-full ${noteDot(note.color)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-zinc-600 font-semibold leading-snug">{note.text}</p>
                </div>
                <span className="flex-shrink-0 text-[10px] text-zinc-400 font-bold pt-0.5">{note.time}</span>
              </div>
            ))}
          </div>
        </div>

      </div>)}

      {/* ── 9. Footer Principles Strip ─────────────────────────────── */}
      <div className="border-t border-zinc-100 pt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: "🛡", title: "Evidence-based", desc: "Decisions grounded in trusted data." },
          { icon: "🔓", title: "Transparent & open", desc: "Open data and clear methods." },
          { icon: "👥", title: "For everyone", desc: "Accessible insights for all." },
          { icon: "🤝", title: "Better together", desc: "A city that listens and improves." },
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

// ── Legend helper ─────────────────────────────────────────────────────────

function LegendItem({
  color,
  label,
  type,
}: {
  color: string;
  label: string;
  type: "line" | "marker" | "dashed";
}) {
  return (
    <div className="flex items-center gap-1.5">
      {type === "marker" ? (
        <span
          className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm flex-shrink-0"
          style={{ background: color }}
        />
      ) : type === "dashed" ? (
        <svg width="18" height="8" viewBox="0 0 18 8" className="flex-shrink-0">
          <line x1="0" y1="4" x2="18" y2="4" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 3" />
        </svg>
      ) : (
        <svg width="18" height="8" viewBox="0 0 18 8" className="flex-shrink-0">
          <line x1="0" y1="4" x2="18" y2="4" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}
      <span className="text-[10px] text-zinc-500 font-semibold">{label}</span>
    </div>
  );
}
