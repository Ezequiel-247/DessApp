export interface DeviationSummary {
  total_subjects: number;
  completed_subjects: number;
  on_time: number;
  ahead: number;
  delayed: number;
  average_delay_terms: number;
}

export interface DeviationSubject {
  plan_subject_id: number;
  subject_id: number;
  subject_name: string;
  official_year: number;
  official_term: number;
  planned_year: number;
  planned_term: number;
  actual_year: number;
  actual_term: number;
  grade: string;
  status: string;
  deviation: "on_time" | "ahead" | "delayed" | "unknown";
  deviation_terms: number;
  deviation_from_official: "on_time" | "ahead" | "delayed" | "unknown";
  deviation_terms_from_official: number;
}

export interface DeviationData {
  plan_name: string;
  summary: DeviationSummary;
  subjects: DeviationSubject[];
}

export interface DeviationResponse {
  data: DeviationData;
}
