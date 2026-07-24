export type NoveltyType = 'post' | 'academic_event';
export type AcademicEventType = 'enrollment' | 'regularization' | 'approval' | 'academic';

export interface NoveltyAuthor {
  id: number;
  name: string;
  avatar: string | null;
}

export interface Novelty {
  id: string;
  type: NoveltyType;
  postId?: number;
  targetType?: 'post' | 'academic_event';
  targetId?: number;
  commentCount?: number;
  eventType?: AcademicEventType;
  status?: string;
  title: string;
  content?: string;
  images?: string[];
  subjectCode?: string | null;
  author: NoveltyAuthor;
  date: string;
  likesCount?: number;
  dislikesCount?: number;
  valoracionRatio?: number;
  myVote?: 'up' | 'down' | null;
}

export interface NoveltyPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface NoveltiesResponse {
  data: Novelty[];
  pagination: NoveltyPagination;
}
