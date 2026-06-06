import { NextResponse, type NextRequest } from "next/server";

// ── MVB Magdeburg line definitions ────────────────────────────────────────
const MVB_LINES = [
  { line: "Tram 1",  route: "Südring – Messegelände" },
  { line: "Tram 2",  route: "Cracau – Alter Markt" },
  { line: "Tram 3",  route: "Stadtfeld – Brücke" },
  { line: "Tram 5",  route: "Hauptbahnhof – Universitätsplatz" },
  { line: "Tram 6",  route: "Neustädter Bahnhof – Beucke" },
  { line: "Tram 9",  route: "Buckau – Hauptbahnhof" },
  { line: "Bus 51",  route: "Olvenstedt – Stadtfeld" },
  { line: "Bus 54",  route: "Sudenburg – Ottersleben" },
  { line: "Bus 73",  route: "HBF – Herrenkrug" },
];

// ── Delay generation — time-of-day aware ──────────────────────────────────
function generateDelayMinutes(hour: number, seed: number): number {
  const isAMRush = hour >= 7 && hour <= 9;
  const isPMRush = hour >= 16 && hour <= 19;
  const isLateNight = hour >= 23 || hour <= 5;
  const isOffPeak = !isAMRush && !isPMRush;

  // Use a deterministic seed so values are stable within the same minute
  const pseudo = ((seed * 9301 + 49297) % 233280) / 233280;

  if (isLateNight) {
    // Night service — mostly on time but sparse
    return pseudo < 0.85 ? 0 : Math.ceil(pseudo * 5);
  }
  if (isAMRush || isPMRush) {
    // Rush hour — higher probability of delays
    if (pseudo < 0.35) return 0;
    if (pseudo < 0.55) return 2;
    if (pseudo < 0.72) return 4;
    if (pseudo < 0.85) return 7;
    if (pseudo < 0.93) return 10;
    return 14;
  }
  // Off-peak — mostly smooth
  if (isOffPeak) {
    if (pseudo < 0.70) return 0;
    if (pseudo < 0.85) return 2;
    if (pseudo < 0.93) return 5;
    return 8;
  }
  return 0;
}

function delayStatus(minutes: number): string {
  if (minutes === 0) return "On Time";
  if (minutes <= 3) return "Minor Delay";
  if (minutes <= 7) return "Delayed";
  return "Significant Delay";
}

function overallStatus(delayCount: number, total: number): string {
  const ratio = delayCount / total;
  if (ratio === 0) return "All Lines On Time";
  if (ratio <= 0.2) return "Minor Delays";
  if (ratio <= 0.45) return "Moderate Delays";
  return "Significant Delays";
}

// Seed changes every 5 minutes so values feel stable but rotate realistically
function getTimeSeed(): number {
  const now = new Date();
  return now.getFullYear() * 100000 +
    now.getMonth() * 10000 +
    now.getDate() * 1000 +
    now.getHours() * 100 +
    Math.floor(now.getMinutes() / 5);
}

// ── Handler ───────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isHistory = searchParams.get("history") === "true";

  const hour = new Date().getHours();
  const seed = getTimeSeed();

  if (isHistory) {
    // Simulate yesterday — slightly worse delays (peak hour scenario)
    const yesterdayHour = (hour + 1) % 24; // shift to make it slightly different
    const yesterdaySeed = seed - 288; // subtract 5-min slots for 24h
    const delays = MVB_LINES.map((ln, i) => {
      const delay = generateDelayMinutes(yesterdayHour, yesterdaySeed + i * 17);
      return {
        line: ln.line,
        route: ln.route,
        delay: `${delay} min`,
        status: delayStatus(delay),
      };
    });
    const delayCount = delays.filter(d => d.delay !== "0 min").length;
    return NextResponse.json({
      status: overallStatus(delayCount, MVB_LINES.length),
      delays,
      delayCount,
      totalLines: MVB_LINES.length,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    });
  }

  // Current — time-aware
  const delays = MVB_LINES.map((ln, i) => {
    const delay = generateDelayMinutes(hour, seed + i * 31);
    return {
      line: ln.line,
      route: ln.route,
      delay: `${delay} min`,
      status: delayStatus(delay),
    };
  });

  const delayCount = delays.filter(d => d.delay !== "0 min").length;
  const onTime = MVB_LINES.length - delayCount;
  const transitScore = Math.round((onTime / MVB_LINES.length) * 100);

  return NextResponse.json({
    status: overallStatus(delayCount, MVB_LINES.length),
    delays,
    delayCount,
    totalLines: MVB_LINES.length,
    transitScore, // 0-100 convenience field
    timestamp: new Date().toISOString(),
  });
}
