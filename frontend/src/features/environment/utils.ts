import type { AirLabel, ComfortLabel, GreenLabel, EnvironmentState } from "./types";

export function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function airScore(label: AirLabel, raw?: number) {
  if (typeof raw === 'number') return clampScore(raw);
  if (label === 'Good') return 85;
  if (label === 'Fair') return 60;
  return 35;
}

export function comfortScore(label: ComfortLabel) {
  if (label === 'Comfortable') return 85;
  if (label === 'Mixed') return 60;
  return 35;
}

export function greenScore(label: GreenLabel) {
  if (label === 'Strong') return 80;
  if (label === 'Moderate') return 60;
  return 40;
}

export function overallEnvironmentScore(args: {
  air: number;
  comfort: number;
  green: number;
}) {
  return 0.45 * args.air + 0.35 * args.comfort + 0.20 * args.green;
}

export function environmentSummary(score: number) {
  if (score >= 80) return 'The city feels fairly healthy and comfortable today.';
  if (score >= 65) return 'Environmental conditions feel mostly manageable today.';
  if (score >= 50) return 'Environmental conditions feel mixed across the city today.';
  return 'Some areas may feel less comfortable than usual today.';
}

export function freshnessLabel(freshness: { state: string; updatedAt?: string; label?: string }) {
  if (freshness.state === 'live' && freshness.updatedAt) {
    const diff = Math.max(1, Math.round((Date.now() - new Date(freshness.updatedAt).getTime()) / 60000));
    return `Updated ${diff} min ago`;
  }
  return freshness.label || 'Using latest available snapshot';
}

export function environmentMeaning(score: number, recommendation?: string): string[] {
  let meaning = "";
  if (score >= 80) {
    meaning = "Outdoor conditions should feel fairly comfortable in much of the city. Time outside, walking and short park visits remain practical options.";
  } else if (score >= 65) {
    meaning = "Conditions are generally manageable today, though some exposed or busier areas may feel less pleasant. Greener and shaded areas may feel more comfortable.";
  } else if (score >= 50) {
    meaning = "Environmental conditions vary more across the city today. It may be worth preferring greener or less exposed areas where possible.";
  } else {
    meaning = "Some parts of the city may feel warmer, less fresh, or less comfortable than usual. Extra care may be sensible during peak outdoor hours.";
  }

  const list = [meaning];
  if (recommendation) {
    list.push(recommendation);
  }
  return list;
}

export function askElbeAnswer(prompt: string, state: EnvironmentState): string {
  if (prompt.includes("outside")) {
    const recText = state.recommendation ? ` ${state.recommendation}` : "";
    return `${state.summary} Outdoor comfort is currently rated as ${state.urbanComfort.label.toLowerCase()} (${state.urbanComfort.displayValue.toLowerCase()}).${recText}`;
  }
  if (prompt.includes("greener") || prompt.includes("calmer")) {
    return `Green access is rated as ${state.greenAccess.label.toLowerCase()} today (${state.greenAccess.displayValue.toLowerCase()}). High-comfort green areas like Stadtpark Rotehorn and Elbauenpark are great options. Note: ${state.notes[2] || "Access to parks is stronger in some districts than others."}`;
  }
  if (prompt.includes("heat") || prompt.includes("air")) {
    return `Air quality is ${state.airQuality.label.toLowerCase()} (${state.airQuality.displayValue.toLowerCase()}), and urban comfort is ${state.urbanComfort.label.toLowerCase()}. ${state.notes[0] || "Air feels fresher away from busier central corridors."}`;
  }
  return "I'm Elbe, your Magdeburg city assistant. Let me know how I can help!";
}
