export interface PrerequisiteItem {
  subject_name: string;
  required_status: string;
  current_status: string;
}

export interface Subject {
  name: string;
  badge: { label: string; variant: string };
  classification?: string;
  grade: string | number;
  credits: string;
  available: boolean;
  prerequisites: PrerequisiteItem[];
  lockIcon?: { icon: string; color: string };
  is_block?: boolean;
  block_type?: string;
  sort_order?: number;
  consumed?: boolean;
  pool_subjects?: Subject[];
  is_unahur?: boolean;
  is_elective?: boolean;
  activities?: { id: number; name: string; credits: number; classification: string; grade?: string; status?: string }[];
  pool_activities?: Subject[];
  minCreditsRequired?: number | null;
  maxCreditsAllowed?: number | null;
  earnedCredits?: number;
}

export interface YearGroup {
  year: number;
  finalizadas: number;
  regularizadas: number;
  enCurso: number;
  faltantes: number;
  hasThead: boolean;
  subjects: Subject[];
}

export interface PendingFinal {
  name: string;
  expires: string;
  expiresAt: string;
  isUrgent: boolean;
  attempts: {
    current: number;
    color: string;
  };
  is_expired: boolean;
}

export interface Condition {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  suffix: string;
}

export interface BlockStats {
  total: number;
  approved: number;
}

export interface MyProgressData {
  years: YearGroup[];
  pendingFinals: PendingFinal[];
  completedUnits: number;
  totalUnits: number;
  progressPercent: number;
  conditions: Condition[];
  accumulatedCredits: number;
  totalCredits: number;
  averageWithFailures: number;
  totalAttempted: number;
  /** Cursadas finalizadas dentro de totalAttempted — es el numerador correcto para "X de Y cursadas", a diferencia de completedUnits (que cuenta avance de plan, no intentos). */
  approvedCount: number;
  efficiencyPercentage: number;
  streakCount: number;
  average: number;
  currentAcademicYear: string;
  mandatory: BlockStats;
  unahur: BlockStats;
  elective: BlockStats;
  credit: BlockStats;
  enrollmentYear: string;
}
