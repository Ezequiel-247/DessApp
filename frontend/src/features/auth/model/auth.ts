export const authStatus = {
  IDLE: 'idle',
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  ERROR: 'error',
} as const;

export type AuthStatus = (typeof authStatus)[keyof typeof authStatus];

export interface Credentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  lastname: string;
  email: string;
  role: string;
}

export interface EnrollmentInput {
  career_id: number;
  study_plan_id: number;
  enrolled_at: string;
}

export interface RegisterData {
  name: string;
  lastname?: string;
  email: string;
  password: string;
  role?: string;
  cuil?: string;
  legajo?: string;
  enrollments?: EnrollmentInput[];
}
