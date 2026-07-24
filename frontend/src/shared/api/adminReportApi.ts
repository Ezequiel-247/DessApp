import { apiClient } from "./apiClient";

export interface MaterialsBySubjectRow {
  subject_id: number;
  subject_name: string;
  career_name: string | null;
  total: number;
  pdf: number;
  video: number;
  link: number;
}

export interface TopRatedMaterial {
  id: number;
  title: string;
  subject_id: number;
  subject_name: string | null;
  likes_count: number;
  dislikes_count: number;
  total_upvotes: number;
  valoracion_ratio: number | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getMaterialsBySubject(params?: {
  career_id?: number;
  career_name?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_key?: string;
  sort_dir?: string;
}): Promise<PaginatedResponse<MaterialsBySubjectRow>> {
  const searchParams = new URLSearchParams();
  if (params?.career_id) searchParams.set("career_id", String(params.career_id));
  if (params?.career_name) searchParams.set("career_name", params.career_name);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.sort_key) searchParams.set("sort_key", params.sort_key);
  if (params?.sort_dir) searchParams.set("sort_dir", params.sort_dir);
  const qs = searchParams.toString();
  const res = await apiClient.get(`/api/reports/materials-by-subject${qs ? `?${qs}` : ""}`);
  return res ?? { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
}

export interface DashboardSummary {
  active_users: number;
  total_materials: number;
  subjects_with_materials: number;
}

export async function getSummary(): Promise<DashboardSummary> {
  const res = await apiClient.get("/api/reports/summary");
  return res?.data ?? { active_users: 0, total_materials: 0, subjects_with_materials: 0 };
}

export interface ModerationStats {
  total_reports: number;
  by_status: { pending: number; verified: number; rejected: number };
  resolution_rate: number;
  by_reason: { reason_name: string; count: number }[];
  by_content_type: { content_type: string; count: number }[];
}

export async function getModerationStats(): Promise<ModerationStats> {
  const res = await apiClient.get("/api/reports/moderation-stats");
  return res?.data ?? { total_reports: 0, by_status: { pending: 0, verified: 0, rejected: 0 }, resolution_rate: 0, by_reason: [], by_content_type: [] };
}

export interface MonthlyBreakdown {
  month: string;
  materials: number;
  sessions: number;
  registrations: number;
  connections: number;
  total: number;
}

export interface ActiveCareer {
  id: number;
  career_name: string;
  career_code: string;
  total_students: number;
  total_materials: number;
  total_sessions: number;
  total_registrations: number;
  total_connections: number;
  score: number;
  score_pct: number;
  monthly_breakdown: MonthlyBreakdown[];
}

export async function getMostActiveCareers(params?: {
  limit?: number;
  start_date?: string;
  end_date?: string;
}): Promise<ActiveCareer[]> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.start_date) searchParams.set("start_date", params.start_date);
  if (params?.end_date) searchParams.set("end_date", params.end_date);
  const qs = searchParams.toString();
  const res = await apiClient.get(`/api/reports/most-active-careers${qs ? `?${qs}` : ""}`);
  return res?.data ?? [];
}

export interface MonthlyUserTrend {
  month: string;
  total: number;
  active: number;
  inactive: number;
}

export interface ActiveUsersData {
  total: number;
  active: number;
  inactive: number;
  monthly_trend: MonthlyUserTrend[];
}

export async function getActiveUsers(params?: {
  start_date?: string;
  end_date?: string;
  role?: string;
}): Promise<ActiveUsersData> {
  const searchParams = new URLSearchParams();
  if (params?.start_date) searchParams.set("start_date", params.start_date);
  if (params?.end_date) searchParams.set("end_date", params.end_date);
  if (params?.role) searchParams.set("role", params.role);
  const qs = searchParams.toString();
  const res = await apiClient.get(`/api/reports/active-users${qs ? `?${qs}` : ""}`);
  return res?.data ?? { total: 0, active: 0, inactive: 0, monthly_trend: [] };
}

export interface CareerOption {
  id: number;
  name: string;
}

export interface SubjectOption {
  id: number;
  name: string;
}

export async function fetchCareers(): Promise<CareerOption[]> {
  const res = await apiClient.get("/api/careers");
  return res?.data ?? [];
}

export async function fetchSubjects(): Promise<SubjectOption[]> {
  const res = await apiClient.get("/api/subjects");
  return res?.data ?? [];
}

export interface CareerApprovedData {
  career_id: number;
  career_name: string;
  total_students: number;
  approved_students: number;
  pct_approved: number;
}

export async function getSubjectsApprovedByCareer(params?: {
  career_id?: number;
}): Promise<CareerApprovedData[]> {
  const searchParams = new URLSearchParams();
  if (params?.career_id) searchParams.set("career_id", String(params.career_id));
  const qs = searchParams.toString();
  const res = await apiClient.get(`/api/reports/subjects-approved-by-career${qs ? `?${qs}` : ""}`);
  return res?.data ?? [];
}

export interface ApprovedDistribution {
  approved_count: number;
  student_count: number;
}

export interface SubjectsApprovedData {
  distribution: ApprovedDistribution[];
  total_students: number;
  students_with_approvals: number;
  students_without_approvals: number;
  pct_without_approvals: number;
  average_approved: number;
  max_approved: number;
}

export async function getSubjectsApprovedByStudent(params?: {
  career_id?: number;
}): Promise<SubjectsApprovedData> {
  const searchParams = new URLSearchParams();
  if (params?.career_id) searchParams.set("career_id", String(params.career_id));
  const qs = searchParams.toString();
  const res = await apiClient.get(`/api/reports/subjects-approved-by-student${qs ? `?${qs}` : ""}`);
  return res?.data ?? { distribution: [], total_students: 0, students_with_approvals: 0, students_without_approvals: 0, pct_without_approvals: 0, average_approved: 0, max_approved: 0 };
}

export interface StudentApprovedInfo {
  id: number;
  name: string;
  lastname: string;
  email: string;
  legajo: string | null;
  approved_count: number;
}

export async function getStudentsByApprovedCount(params: {
  approved_count: number;
  career_id?: number;
}): Promise<StudentApprovedInfo[]> {
  const searchParams = new URLSearchParams();
  searchParams.set("approved_count", String(params.approved_count));
  if (params?.career_id) searchParams.set("career_id", String(params.career_id));
  const res = await apiClient.get(`/api/reports/students-by-approved-count?${searchParams.toString()}`);
  return res?.data ?? [];
}

export interface SubjectByCareerRow {
  subject_id: number;
  subject_name: string;
  total_records: number;
  approved: number;
  desaprobado: number;
  pendiente: number;
  enrolled: number;
}

export interface CareerWithSubjects {
  career_id: number;
  career_name: string;
  total_students: number;
  total_records: number;
  total_approved: number;
  total_subjects: number;
  subjects: SubjectByCareerRow[];
}

export interface SubjectsByCareerTotals {
  total_careers: number;
  total_students: number;
  total_records: number;
  total_approved: number;
}

export async function getSubjectsByCareer(params?: {
  career_id?: number;
  start_date?: string;
  end_date?: string;
}): Promise<{ data: CareerWithSubjects[]; totals: SubjectsByCareerTotals }> {
  const searchParams = new URLSearchParams();
  if (params?.career_id) searchParams.set("career_id", String(params.career_id));
  if (params?.start_date) searchParams.set("start_date", params.start_date);
  if (params?.end_date) searchParams.set("end_date", params.end_date);
  const qs = searchParams.toString();
  const res = await apiClient.get(`/api/reports/subjects-by-career${qs ? `?${qs}` : ""}`);
  return res ?? { data: [], totals: { total_careers: 0, total_students: 0, total_records: 0, total_approved: 0 } };
}

export interface StudentCursadaDistribution {
  cursada_count: number;
  student_count: number;
}

export interface SubjectsByStudentData {
  distribution: StudentCursadaDistribution[];
  total_students: number;
  students_with_records: number;
  students_without_records: number;
  pct_without_records: number;
  average_cursadas: number;
  max_cursadas: number;
}

export async function getSubjectsByStudent(params?: {
  career_id?: number;
  start_date?: string;
  end_date?: string;
}): Promise<SubjectsByStudentData> {
  const searchParams = new URLSearchParams();
  if (params?.career_id) searchParams.set("career_id", String(params.career_id));
  if (params?.start_date) searchParams.set("start_date", params.start_date);
  if (params?.end_date) searchParams.set("end_date", params.end_date);
  const qs = searchParams.toString();
  const res = await apiClient.get(`/api/reports/subjects-by-student${qs ? `?${qs}` : ""}`);
  return res?.data ?? { distribution: [], total_students: 0, students_with_records: 0, students_without_records: 0, pct_without_records: 0, average_cursadas: 0, max_cursadas: 0 };
}

export interface StudentCursadaInfo {
  id: number;
  name: string;
  lastname: string;
  email: string;
  legajo: string | null;
  cursada_count: number;
}

export async function getStudentsByCursadaCount(params: {
  cursada_count: number;
  career_id?: number;
}): Promise<StudentCursadaInfo[]> {
  const searchParams = new URLSearchParams();
  searchParams.set("cursada_count", String(params.cursada_count));
  if (params?.career_id) searchParams.set("career_id", String(params.career_id));
  const res = await apiClient.get(`/api/reports/students-by-cursada-count?${searchParams.toString()}`);
  return res?.data ?? [];
}

export async function getTopRatedMaterials(params?: {
  subject_id?: number;
  sort?: "ratio" | "likes" | "total";
}): Promise<TopRatedMaterial[]> {
  const searchParams = new URLSearchParams();
  if (params?.subject_id) searchParams.set("subject_id", String(params.subject_id));
  if (params?.sort && params.sort !== "ratio") searchParams.set("sort", params.sort);
  const qs = searchParams.toString();
  const res = await apiClient.get(`/api/reports/materials-top-rated${qs ? `?${qs}` : ""}`);
  return res?.data ?? [];
}

export interface StudySessionsUsageSubject {
  subject_id: number;
  subject_name: string;
  total_sessions: number;
  by_status: {
    abierta: number;
    cancelada: number;
    finalizada: number;
  };
  participation: {
    total_registrations: number;
    approved: number;
    pending: number;
    rejected: number;
    occupancy_pct: number;
  };
}

export interface StudySessionsUsageCareer {
  career_id: number;
  career_name: string;
  total_sessions: number;
  by_status: {
    abierta: number;
    cancelada: number;
    finalizada: number;
  };
  participation: {
    total_registrations: number;
    approved: number;
    pending: number;
    rejected: number;
    occupancy_pct: number;
  };
  subjects: StudySessionsUsageSubject[];
}

export interface StudySessionsUsageData {
  totals: {
    total_sessions: number;
    by_status: {
      abierta: number;
      cancelada: number;
      finalizada: number;
    };
    participation: {
      total_registrations: number;
      approved: number;
      pending: number;
      rejected: number;
      avg_occupancy: number;
    };
  };
  monthly_trend: {
    month: string;
    sessions: number;
    registrations: number;
  }[];
  by_career: StudySessionsUsageCareer[];
}

export async function getStudySessionsUsage(params?: {
  career_id?: number;
  start_date?: string;
  end_date?: string;
  type?: string;
}): Promise<StudySessionsUsageData> {
  const searchParams = new URLSearchParams();
  if (params?.career_id) searchParams.set('career_id', String(params.career_id));
  if (params?.start_date) searchParams.set('start_date', params.start_date);
  if (params?.end_date) searchParams.set('end_date', params.end_date);
  if (params?.type) searchParams.set('type', params.type);

  const qs = searchParams.toString();
  const res = await apiClient.get(`/api/reports/study-sessions-usage${qs ? `?${qs}` : ''}`);
  return res?.data ?? {
    totals: {
      total_sessions: 0,
      by_status: { abierta: 0, cancelada: 0, finalizada: 0 },
      participation: { total_registrations: 0, approved: 0, pending: 0, rejected: 0, avg_occupancy: 0 },
    },
    monthly_trend: [],
    by_career: [],
  };
}

export interface SocialDistribution {
  connections_count: number;
  student_count: number;
}

export interface SocialConnectionsData {
  total_students: number;
  students_with_connections: number;
  students_without_connections: number;
  average_connections: number;
  max_connections: number;
  distribution: SocialDistribution[];
  status_breakdown: {
    pending: number;
    accepted: number;
    rejected: number;
  };
}

export interface StudentConnectionInfo {
  id: number;
  name: string;
  lastname: string;
  email: string;
  legajo: string | null;
  connections_count: number;
}

export async function getSocialConnections(params?: {
  start_date?: string;
  end_date?: string;
}): Promise<SocialConnectionsData> {
  const searchParams = new URLSearchParams();
  if (params?.start_date) searchParams.set("start_date", params.start_date);
  if (params?.end_date) searchParams.set("end_date", params.end_date);
  const qs = searchParams.toString();
  const res = await apiClient.get(`/api/reports/social-connections${qs ? `?${qs}` : ""}`);
  return res?.data ?? {
    total_students: 0,
    students_with_connections: 0,
    students_without_connections: 0,
    average_connections: 0,
    max_connections: 0,
    distribution: [],
    status_breakdown: { pending: 0, accepted: 0, rejected: 0 }
  };
}

export async function getStudentsByConnectionsCount(params: {
  connections_count: number;
  career_id?: number;
}): Promise<StudentConnectionInfo[]> {
  const searchParams = new URLSearchParams();
  searchParams.set("connections_count", String(params.connections_count));
  if (params?.career_id) searchParams.set("career_id", String(params.career_id));
  const res = await apiClient.get(`/api/reports/students-by-connections-count?${searchParams.toString()}`);
  return res?.data ?? [];
}

