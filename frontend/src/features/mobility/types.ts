export type FreshnessState = 'live' | 'snapshot' | 'unavailable';
export type TransitLabel = 'Good' | 'Moderate' | 'Poor';
export type DisruptionLabel = 'Low' | 'Moderate' | 'High';
export type ComfortLabel = 'Good' | 'Fair' | 'Limited';

export type MobilityState = {
  freshness: {
    state: FreshnessState;
    updatedAt?: string;
    label: string;
  };
  summary: string;
  overallScore: number;
  transitFlow: {
    label: TransitLabel;
    score: number;
    displayValue: string;
    helper: string;
  };
  disruptionLevel: {
    label: DisruptionLabel;
    active: number;
    score: number;
    helper: string;
  };
  movingComfort: {
    label: ComfortLabel;
    score: number;
    displayValue: string;
    helper: string;
  };
  notes: Array<{
    text: string;
    time: string;
    color: 'green' | 'amber' | 'teal';
  }>;
  recommendation?: string;
  prompts: string[];
};
