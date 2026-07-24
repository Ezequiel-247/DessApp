export interface SimEnrolledSubject {
  plan_subject_id: number;
  subject_name: string;
}

export interface SimUnlockedSubject {
  plan_subject_id: number;
  subject_id: number;
  subject_name: string;
  suggested_year: number;
  suggested_term: number;
  credits: number;
  weekly_hours: number;
  unlocked_by: number[];
}

export interface SimulateResponse {
  currently_in_course: SimEnrolledSubject[];
  simulated_subjects: SimEnrolledSubject[];
  newly_unlocked: SimUnlockedSubject[];
  currently_available: SimUnlockedSubject[];
}
