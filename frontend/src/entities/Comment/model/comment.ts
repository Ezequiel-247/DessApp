export type CommentTargetType = 'post' | 'academic_event';

export interface CommentAuthor {
  id: number;
  name: string;
  avatar: string | null;
}

export interface Comment {
  id: number;
  targetType: CommentTargetType;
  targetId: number;
  content: string;
  author: CommentAuthor;
  date: string;
  likesCount?: number;
  dislikesCount?: number;
  totalUpvotes?: number;
  valoracionRatio?: number;
  myVote?: 'up' | 'down' | null;
}
