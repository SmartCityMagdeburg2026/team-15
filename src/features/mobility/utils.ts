import type { TransitLabel, DisruptionLabel, ComfortLabel, MobilityState } from './types';

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function transitScore(label: TransitLabel, raw?: number): number {
  if (typeof raw === 'number') return clampScore(raw);
  if (label === 'Good') return 90;
  if (label === 'Moderate') return 65;
  return 35;
}

export function disruptionScore(active: number): number {
  if (active === 0) return 100;
  if (active <= 2) return 80;
  if (active <= 4) return 60;
  if (active <= 6) return 40;
  return 20;
}

export function comfortScore(label: ComfortLabel): number {
  if (label === 'Good') return 85;
  if (label === 'Fair') return 60;
  return 35;
}

export function overallMobilityScore(args: {
  transit: number;
  disruptions: number;
  comfort: number;
}): number {
  return 0.5 * args.transit + 0.3 * args.disruptions + 0.2 * args.comfort;
}

export function mobilitySummary(score: number): string {
  if (score >= 80) return 'Getting around feels mostly smooth today.';
  if (score >= 65) return 'Getting around is manageable today, with a few local slowdowns.';
  if (score >= 50) return 'Getting around may take a bit longer today in some areas.';
  return 'Getting around feels more difficult than usual today.';
}

export function mobilityMeaning(score: number, recommendation?: string): string[] {
  const lines: string[] = [];
  if (score >= 80) {
    lines.push('Most buses and trams are on time, so you can plan with confidence.');
    lines.push('A couple of minor disruptions may cause short delays in some areas.');
    if (recommendation) lines.push(recommendation);
    else lines.push('Streets are clear and it\'s a good day for walking or cycling.');
  } else if (score >= 65) {
    lines.push('Most trips are still manageable today, though a few corridors may feel slower than usual.');
    lines.push('Allow a little extra time around affected areas.');
    if (recommendation) lines.push(recommendation);
  } else if (score >= 50) {
    lines.push('Some trips may take longer today, especially near local disruption points.');
    lines.push('Planning for a small delay is sensible.');
    if (recommendation) lines.push(recommendation);
  } else {
    lines.push('Several conditions are making movement less smooth than usual today.');
    lines.push('Extra travel time may be needed on affected corridors.');
    if (recommendation) lines.push(recommendation);
  }
  return lines;
}

export function askElbeAnswer(prompt: string, state: MobilityState): string {
  if (prompt.toLowerCase().includes('easy')) {
    return `${state.summary} ${state.recommendation ?? 'Short trips and cycling remain practical options.'}`;
  }
  if (prompt.toLowerCase().includes('disruption')) {
    const count = state.disruptionLevel.active;
    const topNote = state.notes.find(n => n.color === 'amber');
    return count === 0
      ? 'No major disruptions right now. Movement across the city is smooth.'
      : `There are currently ${count} active disruption${count > 1 ? 's' : ''}. ${topNote ? topNote.text : state.disruptionLevel.helper}`;
  }
  if (prompt.toLowerCase().includes('cycle')) {
    return state.movingComfort.label === 'Good'
      ? `Yes — conditions are good today. ${state.movingComfort.helper} Roads are clear and cycling routes are comfortable.`
      : state.movingComfort.label === 'Fair'
      ? `Cycling is possible today, though conditions are a bit mixed. ${state.movingComfort.helper}`
      : `Cycling may be more challenging than usual today. ${state.movingComfort.helper}`;
  }
  return state.summary;
}

export function freshnessLabel(state: MobilityState['freshness']): string {
  if (state.state === 'live' && state.updatedAt) {
    const diff = Math.floor((Date.now() - new Date(state.updatedAt).getTime()) / 60000);
    return `Updated ${diff} min ago`;
  }
  if (state.state === 'snapshot') return 'Using latest available snapshot';
  return 'Live data temporarily unavailable';
}
