export type FreshnessState = 'live' | 'snapshot' | 'unavailable';
export type AirLabel = 'Good' | 'Fair' | 'Poor';
export type ComfortLabel = 'Comfortable' | 'Mixed' | 'Stressed';
export type GreenLabel = 'Strong' | 'Moderate' | 'Uneven';

export type EnvironmentState = {
  freshness: {
    state: FreshnessState;
    updatedAt?: string;
    label: string;
  };
  summary: string;
  overallScore: number;
  airQuality: {
    label: AirLabel;
    score: number;
    displayValue: string;
    helper: string;
  };
  urbanComfort: {
    label: ComfortLabel;
    score: number;
    displayValue: string;
    helper: string;
  };
  greenAccess: {
    label: GreenLabel;
    score: number;
    displayValue: string;
    helper: string;
  };
  notes: string[];
  recommendation?: string;
  prompts: string[];
};
