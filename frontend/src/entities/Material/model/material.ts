export interface Material {
  id: string;
  subjectId: string;
  subjectName?: string;
  title: string;
  type: MaterialType;
  fileUrl: string | null;
  uploadedAt: string;
  authorId: string;
  authorName?: string;
  likesCount: number;
  dislikesCount: number;
  totalUpvotes: number;
  valoracionRatio: number | null;
  status: string;
  tags: string[];
  reportCounts?: { pending: number; verified: number };
  myVote?: "up" | "down" | null;
  reports?: any[];
}

export const MATERIAL_TYPE = {
  PDF: "pdf",
  VIDEO: "video",
  LINK: "link",
  DISCORD: "discord",
} as const;

export type MaterialType = (typeof MATERIAL_TYPE)[keyof typeof MATERIAL_TYPE];

export type SortOption = "new" | "top";

export interface MaterialFilters {
  studentId?: string;
  careerId?: string;
  subjectId?: string;
  sort?: SortOption;
  q?: string;
  viewerStudentId?: string;
}

export function normalizeMaterial(data: any): Material {
  const tags = (() => {
    const raw = data.tags;
    if (Array.isArray(raw)) return raw as string[];
    if (typeof raw === "string") {
      try { return JSON.parse(raw) as string[]; } catch { return []; }
    }
    return [];
  })();

  const normalizedFileUrl =
    data.file_url !== undefined
      ? (data.file_url ?? null)
      : data.fileUrl !== undefined
        ? (data.fileUrl ?? null)
        : data.url !== undefined
          ? (data.url ?? null)
          : "";

  return {
    id: String(data.id),
    subjectId: String(data.id_subject ?? data.subjectId ?? data.subject_id ?? ""),
    subjectName: data.Subject?.name ?? data.subject_name ?? data.subjectName ?? undefined,
    title: data.title ?? "",
    type: (data.type ?? "pdf") as MaterialType,
    fileUrl: data.file_url !== undefined ? (data.file_url ?? null) : (data.fileUrl !== undefined ? data.fileUrl : (data.url !== undefined ? data.url : null)),
    uploadedAt: data.uploadedAt ?? data.createdAt ?? data.created_at ?? "",
    authorId: String(data.id_author ?? data.authorId ?? data.author_id ?? ""),
    authorName: data.author_name ?? data.authorName ?? undefined,
    likesCount: data.likes_count ?? data.likesCount ?? 0,
    dislikesCount: data.dislikes_count ?? data.dislikesCount ?? 0,
    totalUpvotes: data.total_upvotes ?? data.totalUpvotes ?? 0,
    valoracionRatio: data.valoracion_ratio ?? data.valoracionRatio ?? null,
    status: data.status ?? "active",
    tags,
    reportCounts: data.report_counts ?? undefined,
    myVote: data.my_vote ?? null,
    reports: data.reports ?? undefined,
  };
}

export function denormalizeMaterial(data: Partial<Material>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (data.subjectId !== undefined) payload.id_subject = data.subjectId;
  if (data.title !== undefined) payload.title = data.title;
  if (data.type !== undefined) payload.type = data.type;
  if (data.fileUrl !== undefined) payload.file_url = data.fileUrl;
  if (data.authorId !== undefined) payload.id_author = data.authorId;
  if (data.totalUpvotes !== undefined) payload.total_upvotes = data.totalUpvotes;
  if (data.status !== undefined) payload.status = data.status;
  if (data.tags !== undefined) payload.tags = data.tags;
  return payload;
}

export function isDiscordUrl(url: string | null): boolean {
  if (!url) return false;
  return url.includes("discord.gg") || url.includes("discord.com/invite");
}
