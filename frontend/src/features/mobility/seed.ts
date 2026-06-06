import type { MobilityState } from './types';

export const mobilitySeed: MobilityState = {
  freshness: {
    state: 'snapshot',
    updatedAt: '2026-06-06T10:45:00+02:00',
    label: 'Using latest available snapshot',
  },
  summary: 'Getting around feels mostly smooth today.',
  overallScore: 86.5,
  transitFlow: {
    label: 'Good',
    score: 91,
    displayValue: '91%',
    helper: 'Buses and trams are running frequently with few delays.',
  },
  disruptionLevel: {
    label: 'Low',
    active: 2,
    score: 80,
    helper: 'A few minor issues. No major disruptions right now.',
  },
  movingComfort: {
    label: 'Good',
    score: 85,
    displayValue: 'Light traffic',
    helper: 'Roads are clear and public spaces feel comfortable.',
  },
  notes: [
    {
      text: 'Tram 1 delay in Sudenburg — Minor signal issue. Expect up to 10 min delay.',
      time: '08:20',
      color: 'amber',
    },
    {
      text: 'Road work on Leipziger Straße — Single lane closed near Westring. Drive carefully.',
      time: '07:45',
      color: 'amber',
    },
    {
      text: 'Elbbrücke clear — No restrictions on the Elbe bridge. Traffic is moving well.',
      time: '07:30',
      color: 'green',
    },
  ],
  recommendation: 'Best for: short city trips and cycling.',
  prompts: [
    'Will getting around be easy today?',
    'Are there disruptions I should know?',
    'Is it a good day to cycle?',
  ],
};
