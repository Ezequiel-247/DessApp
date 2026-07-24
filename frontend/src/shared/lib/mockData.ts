// @ts-ignore
import type { Career, CareerPlanStatus } from "@/entities/Career/model/career";
// @ts-ignore
import type { Subject } from "@/entities/Subject/model/subject";
// @ts-ignore
import type { User } from "@/entities/User/model/user";
// @ts-ignore
import type { Material } from "@/entities/Material/model/material";
// @ts-ignore
import type { Notification } from "@/entities/Notification/model/notification";
// @ts-ignore
import type { AcademicRecord } from "@/entities/AcademicRecord/model/academicRecord";
// @ts-ignore
import type { Session } from "@/entities/Session/model/session";
// @ts-ignore
import type { Connection } from "@/entities/Connection/model/connection";

// ── Local interfaces not covered by entity models ─────────────────────────────

interface Institute {
  id: string;
  name: string;
  shortName: string;
}

interface Plan {
  id: string;
  careerId: string;
  name: string;
  status: CareerPlanStatus;
  duration: number;
}

interface PlanSubject {
  id: string;
  planId: string;
  subjectId: string;
  year: number;
  semester: number;
  isAnnual: boolean;
  credits: number;
  prerequisites: string[];
}

type CareerMock = Career & {
  subjects: string[];
};

/** Material extended with UI-only fields (tags) */
type MaterialMock = Material & {
  tags: string[];
};

interface FeedPost {
  id: string;
  authorId: string;
  type: string;
  title: string;
  content: string;
  createdAt: string;
  metrics: { likes: number; comments: number };
}

interface ProgressSubject {
  id: string;
  name: string;
  approved: number;
  total: number;
  percentage: number;
  grade: number | undefined;
}

interface ProgressData {
  summary: {
    approved: number;
    pending: number;
    failed: number;
    averageGrade: number;
    totalCredits: number;
  };
  subjects: ProgressSubject[];
}

interface UpcomingSession {
  id: string;
  dayLabel: string;
  time: string;
  title: string;
  location: string;
  icon: string;
}

interface CurrentSubject {
  id: string;
  name: string;
  professor: string;
  average: number;
  progress: number;
  state: string;
}

interface ContactActivity {
  id: string;
  userId: string;
  action: string;
  subjectId: string;
  createdAt: string;
}

interface DashboardData {
  studentId: string;
  greeting: string;
  careerLabel: string;
  progressPercentage: number;
  credits: { approved: number; total: number };
  currentAverage: { value: number; scale: number };
  pendingSubjects: number;
  nextGoal: string;
  upcomingSessions: UpcomingSession[];
  currentSubjects: CurrentSubject[];
  contactActivity: ContactActivity[];
}

interface ProfilePrivacy {
  publicProfile: boolean;
  showAcademicStatus: boolean;
  publishApprovals: boolean;
  showEmail: boolean;
}

interface ProfileData {
  userId: string;
  displayName: string;
  careerName: string;
  university: string;
  email: string;
  enrollment: string;
  privacy: ProfilePrivacy;
}

interface AdminReport {
  id: string;
  materialId: string;
  reason: string;
  status: string;
}

interface AdminData {
  thresholds: { pendingReportsLimit: number; verifiedReportsLimit: number };
  reports: AdminReport[];
}

// ── Mock data ─────────────────────────────────────────────────────────────────

export const mockInstitutes: Institute[] = [
  {
    id: "ins_1",
    name: "Instituto de Ciencias Exactas y Naturales",
    shortName: "ICEN",
  },
  {
    id: "ins_2",
    name: "Instituto de Ciencias Humanas",
    shortName: "ICH",
  },
  {
    id: "ins_3",
    name: "Instituto de Ciencias de la Salud",
    shortName: "ICS",
  },
];

export const mockCareers: CareerMock[] = [
  {
    id: "car_1",
    instituteId: "ins_1",
    name: "Licenciatura en Sistemas",
    degreeTitle: "Licenciado en Sistemas",
    code: "LIS",
    description: "Carrera orientada a la formacion de profesionales en tecnologia de la informacion.",
    duration: 5,
    subjects: ["subj_1", "subj_2", "subj_3", "subj_4", "subj_5"],
  },
  {
    id: "car_2",
    instituteId: "ins_1",
    name: "Analista de Sistemas",
    degreeTitle: "Analista de Sistemas",
    code: "AS",
    description: "Formacion tecnica en desarrollo y analisis de sistemas.",
    duration: 3,
    subjects: ["subj_1", "subj_2", "subj_3"],
  },
  {
    id: "car_3",
    instituteId: "ins_1",
    name: "Ingenieria en Informatica",
    degreeTitle: "Ingeniero en Informatica",
    code: "II",
    description: "Carrera de ingenieria con foco en sistemas computacionales.",
    duration: 5,
    subjects: ["subj_1", "subj_2", "subj_3", "subj_4", "subj_5"],
  },
];

export const mockPlans: Plan[] = [
  { id: "plan_1", careerId: "car_1", name: "Plan 2023", status: "vigente", duration: 5 },
  { id: "plan_2", careerId: "car_1", name: "Plan 2018", status: "en_transicion", duration: 5 },
  { id: "plan_3", careerId: "car_2", name: "Plan 2020", status: "vigente", duration: 3 },
];

export const mockPlanSubjects: PlanSubject[] = [
  // Plan 2023 (Licenciatura en Sistemas) - 5 años
  {
    id: "ps_1",
    planId: "plan_1",
    subjectId: "subj_1",
    year: 1,
    semester: 1,
    isAnnual: false,
    credits: 8,
    prerequisites: [],
  },
  {
    id: "ps_2",
    planId: "plan_1",
    subjectId: "subj_2",
    year: 1,
    semester: 2,
    isAnnual: false,
    credits: 6,
    prerequisites: ["subj_1"],
  },
  {
    id: "ps_3",
    planId: "plan_1",
    subjectId: "subj_3",
    year: 2,
    semester: 1,
    isAnnual: false,
    credits: 8,
    prerequisites: ["subj_1", "subj_2"],
  },
  {
    id: "ps_4",
    planId: "plan_1",
    subjectId: "subj_4",
    year: 2,
    semester: 2,
    isAnnual: false,
    credits: 8,
    prerequisites: ["subj_2", "subj_3"],
  },
  {
    id: "ps_5",
    planId: "plan_1",
    subjectId: "subj_5",
    year: 3,
    semester: 1,
    isAnnual: false,
    credits: 6,
    prerequisites: ["subj_3", "subj_4"],
  },

  // Plan 2018 (Licenciatura en Sistemas) - 5 años (antiguo)
  {
    id: "ps_6",
    planId: "plan_2",
    subjectId: "subj_1",
    year: 1,
    semester: 1,
    isAnnual: false,
    credits: 8,
    prerequisites: [],
  },
  {
    id: "ps_7",
    planId: "plan_2",
    subjectId: "subj_2",
    year: 1,
    semester: 2,
    isAnnual: false,
    credits: 6,
    prerequisites: ["subj_1"],
  },
  {
    id: "ps_8",
    planId: "plan_2",
    subjectId: "subj_3",
    year: 2,
    semester: 1,
    isAnnual: false,
    credits: 8,
    prerequisites: ["subj_2"],
  },
  {
    id: "ps_9",
    planId: "plan_2",
    subjectId: "subj_4",
    year: 2,
    semester: 2,
    isAnnual: false,
    credits: 8,
    prerequisites: ["subj_3"],
  },
  {
    id: "ps_10",
    planId: "plan_2",
    subjectId: "subj_5",
    year: 3,
    semester: 1,
    isAnnual: false,
    credits: 6,
    prerequisites: ["subj_4"],
  },

  // Plan 2020 (Analista de Sistemas) - 3 años
  {
    id: "ps_11",
    planId: "plan_3",
    subjectId: "subj_6",
    year: 1,
    semester: 1,
    isAnnual: false,
    credits: 8,
    prerequisites: [],
  },
  {
    id: "ps_12",
    planId: "plan_3",
    subjectId: "subj_7",
    year: 1,
    semester: 2,
    isAnnual: false,
    credits: 6,
    prerequisites: ["subj_6"],
  },
  {
    id: "ps_13",
    planId: "plan_3",
    subjectId: "subj_8",
    year: 2,
    semester: 1,
    isAnnual: false,
    credits: 8,
    prerequisites: ["subj_6", "subj_7"],
  },
];

export const mockSubjects: Subject[] = [
  { id: "subj_1", name: "Algoritmos y Estructuras de Datos", code: "AED", is_unahur: true },
  { id: "subj_2", name: "Matematica Discreta", code: "MD", is_unahur: true },
  { id: "subj_3", name: "Base de Datos", code: "BD", is_unahur: true },
  { id: "subj_4", name: "Programacion Orientada a Objetos", code: "POO", is_unahur: true },
  { id: "subj_5", name: "Redes de Computadoras", code: "RC", is_unahur: true },
  { id: "subj_6", name: "Fundamentos de Economia", code: "FE", is_unahur: true },
  { id: "subj_7", name: "Estadistica Aplicada", code: "EA", is_unahur: true },
  { id: "subj_8", name: "Analisis de Sistemas", code: "ASI", is_unahur: true },
];

export const mockAcademicRecords: AcademicRecord[] = [
  { id: "acr_1", studentId: "usr_1", subjectId: "subj_1", year: 1, semester: 1, grade: "8", status: "approved" },
  { id: "acr_2", studentId: "usr_1", subjectId: "subj_2", year: 1, semester: 1, grade: "7", status: "approved" },
  { id: "acr_3", studentId: "usr_1", subjectId: "subj_3", year: 1, semester: 2, grade: "5", status: "pending" },
  { id: "acr_4", studentId: "usr_1", subjectId: "subj_4", year: 2, semester: 1, grade: "9", status: "approved" },
  { id: "acr_5", studentId: "usr_1", subjectId: "subj_5", year: 2, semester: 1, grade: "4", status: "failed" },
  { id: "acr_6", studentId: "usr_1", subjectId: "subj_6", year: 2, semester: 2, grade: "6", status: "approved" },
  { id: "acr_7", studentId: "usr_1", subjectId: "subj_7", year: 3, semester: 1, grade: "7", status: "pending" },
  { id: "acr_8", studentId: "usr_1", subjectId: "subj_8", year: 3, semester: 1, grade: "8", status: "approved" },
];

export const mockUsers = [
  {
    id: "usr_1",
    name: "Maria Garcia",
    lastname: "Garcia",
    email: "maria.garcia@unahur.edu.ar",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=maria",
    role: "student",
    is_active: true,
    careerId: "car_1",
    year: 3,
    subjects: ["subj_1", "subj_2", "subj_3"],
    progressStats: { approvedSubjects: 12, pendingSubjects: 5, failedSubjects: 1, averageGrade: 7.5, totalCredits: 96 },
  },
  {
    id: "usr_2",
    name: "Juan Perez",
    lastname: "Perez",
    email: "juan.perez@unahur.edu.ar",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=juan",
    role: "student",
    is_active: true,
    careerId: "car_1",
    year: 2,
    subjects: ["subj_4", "subj_5"],
    progressStats: { approvedSubjects: 8, pendingSubjects: 3, failedSubjects: 0, averageGrade: 8.2, totalCredits: 64 },
  },
  {
    id: "usr_3",
    name: "Elena Rodriguez",
    lastname: "Rodriguez",
    email: "elena.rodriguez@unahur.edu.ar",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=elena",
    role: "student",
    is_active: true,
    careerId: "car_3",
    year: 4,
    subjects: ["subj_1", "subj_2", "subj_3", "subj_4"],
    progressStats: { approvedSubjects: 18, pendingSubjects: 2, failedSubjects: 1, averageGrade: 8.7, totalCredits: 144 },
  },
  {
    id: "usr_4",
    name: "Dr. Carlos Rodriguez",
    lastname: "Rodriguez",
    email: "c.rodriguez@unahur.edu.ar",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=carlos",
    role: "admin",
    is_active: true,
    careerId: "car_1",
    year: 0,
    subjects: ["subj_1"],
    progressStats: { approvedSubjects: 0, pendingSubjects: 0, failedSubjects: 0, averageGrade: 0, totalCredits: 0 },
  },
  {
    id: "usr_5",
    name: "Dra. Ana Martinez",
    lastname: "Martinez",
    email: "a.martinez@unahur.edu.ar",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ana",
    role: "admin",
    is_active: true,
    careerId: "car_1",
    year: 0,
    subjects: ["subj_2"],
    progressStats: { approvedSubjects: 0, pendingSubjects: 0, failedSubjects: 0, averageGrade: 0, totalCredits: 0 },
  },
  {
    id: "usr_6",
    name: "Sofia Pereyra",
    lastname: "Pereyra",
    email: "s.pereyra@unahur.edu.ar",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sofia",
    role: "student",
    is_active: true,
    careerId: "car_2",
    year: 1,
    subjects: ["subj_6", "subj_7"],
    progressStats: { approvedSubjects: 3, pendingSubjects: 2, failedSubjects: 0, averageGrade: 7.8, totalCredits: 24 },
  },
  {
    id: "usr_7",
    name: "Tomas Vega",
    lastname: "Vega",
    email: "t.vega@unahur.edu.ar",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=tomas",
    role: "admin",
    is_active: true,
    careerId: "car_1",
    year: 5,
    subjects: [],
    progressStats: { approvedSubjects: 0, pendingSubjects: 0, failedSubjects: 0, averageGrade: 0, totalCredits: 0 },
  },
  {
    id: "usr_8",
    name: "Paula Ruiz",
    lastname: "Ruiz",
    email: "p.ruiz@unahur.edu.ar",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=paula",
    role: "student",
    is_active: true,
    careerId: "car_2",
    year: 2,
    subjects: ["subj_6", "subj_8"],
    progressStats: { approvedSubjects: 6, pendingSubjects: 3, failedSubjects: 1, averageGrade: 7.2, totalCredits: 48 },
  },
  {
    id: "usr_9",
    name: "Pedro Sanchez",
    lastname: "Sanchez",
    email: "p.sanchez@unahur.edu.ar",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=pedro",
    role: "student",
    is_active: true,
    careerId: "car_1",
    year: 4,
    subjects: ["subj_3"],
    progressStats: { approvedSubjects: 14, pendingSubjects: 1, failedSubjects: 0, averageGrade: 8.4, totalCredits: 112 },
  },
  {
    id: "usr_10",
    name: "Dr. Luis Garcia",
    lastname: "Garcia",
    email: "l.garcia@unahur.edu.ar",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=luis",
    role: "student",
    is_active: true,
    careerId: "car_1",
    year: 1,
    subjects: ["subj_4"],
    progressStats: { approvedSubjects: 5, pendingSubjects: 2, failedSubjects: 0, averageGrade: 7.9, totalCredits: 40 },
  },
] as unknown as User[];

export const mockMaterials: MaterialMock[] = [
  { id: "mat_1", subjectId: "subj_1", title: "Apuntes de Algoritmos - Unidad 1", type: "pdf", fileUrl: "/materials/apuntes-algo-u1.pdf", uploadedAt: "2024-03-15T10:30:00Z", authorId: "usr_1", tags: ["resumen", "parcial1"], totalUpvotes: 124, status: "active" },
  { id: "mat_2", subjectId: "subj_1", title: "Video: Introduccion a estructuras de datos", type: "video", fileUrl: "https://youtube.com/watch?v=example", uploadedAt: "2024-03-10T14:00:00Z", authorId: "usr_3", tags: ["explicacion", "teoria"], totalUpvotes: 89, status: "active" },
  { id: "mat_3", subjectId: "subj_2", title: "Guia de ejercicios - Matematica Discreta", type: "pdf", fileUrl: "/materials/guia-md-2024.pdf", uploadedAt: "2024-03-12T09:00:00Z", authorId: "usr_2", tags: ["practica", "guias"], totalUpvotes: 78, status: "active" },
  { id: "mat_4", subjectId: "subj_3", title: "Tutorial de SQL", type: "link", fileUrl: "https://sql-tutorial.com", uploadedAt: "2024-03-08T16:45:00Z", authorId: "usr_1", tags: ["base de datos", "sql"], totalUpvotes: 65, status: "active" },
];

export const mockNotifications: Notification[] = [
  { id: "notif_1", userId: "usr_1", type: "info", title: "Nuevo material disponible", message: "Se agrego un nuevo PDF en Algoritmos y Estructuras de Datos", read: false, createdAt: "2024-03-15T10:30:00Z" },
  { id: "notif_2", userId: "usr_1", type: "success", title: "Felicitaciones", message: "Has aprobado Matematica Discreta con 7 puntos", read: true, createdAt: "2024-03-10T14:00:00Z" },
  { id: "notif_3", userId: "usr_1", type: "warning", title: "Recordatorio de examen", message: "Tu examen de Base de Datos es manana a las 18:00", read: false, createdAt: "2024-03-08T09:00:00Z" },
];

export const mockAuthSessions: Session[] = [
  { id: "ses_1", userId: "usr_1", token: "session-token-usr-1", createdAt: "2026-04-27T08:00:00Z", expiresAt: "2026-04-27T20:00:00Z" },
  { id: "ses_2", userId: "usr_3", token: "session-token-usr-3", createdAt: "2026-04-27T09:00:00Z", expiresAt: "2026-04-27T21:00:00Z" },
];

export const mockConnections: Connection[] = [
  { id: "conn_1", userId: "usr_1", connectedUserId: "usr_2", status: "accepted", createdAt: "2024-03-02T10:00:00Z" },
  { id: "conn_2", userId: "usr_1", connectedUserId: "usr_3", status: "pending", createdAt: "2024-03-20T12:30:00Z" },
  { id: "conn_3", userId: "usr_2", connectedUserId: "usr_3", status: "accepted", createdAt: "2024-02-28T15:15:00Z" },
];

export const mockFeedPosts: FeedPost[] = [
  { id: "feed_1", authorId: "usr_3", type: "achievement", title: "Aprobo Fisica II con honores", content: "Despues de meses de estudio en la biblioteca y muchas tazas de cafe, finalmente lo logramos.", createdAt: "2024-03-16T18:30:00Z", metrics: { likes: 24, comments: 5 } },
  { id: "feed_2", authorId: "usr_2", type: "session", title: "Grupo de estudio: Matematicas Discretas", content: "Sesion virtual para resolver dudas del parcial 1.", createdAt: "2024-03-15T13:00:00Z", metrics: { likes: 12, comments: 3 } },
  { id: "feed_3", authorId: "usr_1", type: "post", title: "Busco apuntes de Algoritmos Avanzados", content: "Si alguien tiene material actualizado, me sirve mucho para repasar grafos dirigidos.", createdAt: "2024-03-14T09:10:00Z", metrics: { likes: 2, comments: 1 } },
];

export const mockProgressData: ProgressData = {
  summary: { approved: 12, pending: 4, failed: 1, averageGrade: 7.5, totalCredits: 96 },
  subjects: [
    { id: "1", name: "Analisis Matematico II", approved: 3, total: 4, percentage: 75, grade: 7 },
    { id: "2", name: "Paradigmas de Programacion", approved: 4, total: 4, percentage: 100, grade: 8 },
    { id: "3", name: "Estructuras de Datos", approved: 2, total: 4, percentage: 50, grade: 6 },
    { id: "4", name: "Base de Datos", approved: 1, total: 4, percentage: 25, grade: 5 },
    { id: "5", name: "Ingenieria de Software", approved: 0, total: 4, percentage: 0, grade: undefined },
  ],
};

export const mockDashboardData: DashboardData = {
  studentId: "usr_3",
  greeting: "Hola, Sofia",
  careerLabel: "Ingeniería de Sistemas - 6to Cuatrimestre",
  progressPercentage: 65,
  credits: { approved: 110, total: 170 },
  currentAverage: { value: 4.2, scale: 5.0 },
  pendingSubjects: 18,
  nextGoal: "Seminario Grado",
  upcomingSessions: [
    { id: "sess_dash_1", dayLabel: "HOY", time: "14:00", title: "Tutoria: Calculo III", location: "Sala Virtual B", icon: "videocam" },
    { id: "sess_dash_2", dayLabel: "MIE", time: "09:30", title: "Grupo Estudio: Bases Datos", location: "Biblioteca Central", icon: "location_on" },
  ],
  currentSubjects: [
    { id: "dash_sub_1", name: "Arquitectura de Software", professor: "Dr. Carlos Mendez", average: 4.5, progress: 90, state: "Excelente" },
    { id: "dash_sub_2", name: "Calculo Multivariado", professor: "Dra. Elena Rivas", average: 3.2, progress: 64, state: "En Riesgo" },
    { id: "dash_sub_3", name: "Inteligencia Artificial", professor: "Ing. Roberto Gomez", average: 4.0, progress: 80, state: "Bueno" },
  ],
  contactActivity: [
    { id: "act_1", userId: "usr_2", action: "aprobo", subjectId: "subj_2", createdAt: "2024-03-15T10:00:00Z" },
    { id: "act_2", userId: "usr_3", action: "se inscribio", subjectId: "subj_5", createdAt: "2024-03-14T15:30:00Z" },
  ],
};

export const mockProfileData: ProfileData = {
  userId: "usr_3",
  displayName: "Elena Rodriguez",
  careerName: "Ingenieria Informatica",
  university: "Universidad Tecnologica Nacional",
  email: "e.rodriguez@alumnos.utn.edu",
  enrollment: "2021-98745",
  privacy: { publicProfile: true, showAcademicStatus: true, publishApprovals: false, showEmail: false },
};

export const mockAdminData: AdminData = {
  thresholds: { pendingReportsLimit: 10, verifiedReportsLimit: 3 },
  reports: [
    { id: "rep_1", materialId: "mat_4", reason: "spam", status: "pending" },
    { id: "rep_2", materialId: "mat_2", reason: "copyright", status: "verified" },
  ],
};

export const mockData = {
  institutes: mockInstitutes,
  careers: mockCareers,
  plans: mockPlans,
  planSubjects: mockPlanSubjects,
  subjects: mockSubjects,
  academicRecords: mockAcademicRecords,
  users: mockUsers,
  materials: mockMaterials,
  notifications: mockNotifications,
  sessions: mockAuthSessions,
  connections: mockConnections,
  feedPosts: mockFeedPosts,
  progress: mockProgressData,
  dashboard: mockDashboardData,
  profile: mockProfileData,
  admin: mockAdminData,
};

export default mockData;
