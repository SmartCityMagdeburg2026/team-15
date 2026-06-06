import type { EnvironmentState } from "./types";

export const environmentSeed: EnvironmentState = {
  freshness: {
    state: 'snapshot',
    updatedAt: '2026-06-06T10:45:00+02:00',
    label: 'Using latest available snapshot'
  },
  summary: 'The city feels fairly healthy and comfortable today.',
  overallScore: 80.75,
  airQuality: {
    label: 'Good',
    score: 84,
    displayValue: 'Good air conditions',
    helper: 'Air conditions are suitable for most outdoor activity.'
  },
  urbanComfort: {
    label: 'Comfortable',
    score: 83,
    displayValue: 'Mild outdoors',
    helper: 'Outdoor conditions feel comfortable for walking and everyday time outside.'
  },
  greenAccess: {
    label: 'Moderate',
    score: 60,
    displayValue: 'Nearby in many districts',
    helper: 'Green access is decent overall, though not equally distributed.'
  },
  notes: [
    'Air feels fresher away from busier central corridors.',
    'Greener and shaded areas may feel more comfortable around midday.',
    'Access to parks is stronger in some districts than others.'
  ],
  recommendation: 'Best for: short walks and time in greener areas.',
  prompts: [
    'Is it a good day to spend time outside?',
    'Which areas feel greener or calmer today?',
    'Should I expect heat or poor air anywhere?'
  ]
};
