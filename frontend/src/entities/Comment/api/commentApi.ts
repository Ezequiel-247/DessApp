import { apiClient } from '@/shared/api/apiClient';
import type { Comment, CommentTargetType } from '../model/comment';

export interface GetCommentsParams {
  targetType: CommentTargetType;
  targetId: number;
}

export interface CreateCommentInput {
  targetType: CommentTargetType;
  targetId: number;
  content: string;
}

function normalizeComment(raw: any): Comment {
  return {
    id: raw.id,
    targetType: raw.targetType,
    targetId: raw.targetId,
    content: raw.content,
    author: raw.author,
    date: raw.date,
    likesCount: raw.likes_count ?? raw.likesCount,
    dislikesCount: raw.dislikes_count ?? raw.dislikesCount,
    totalUpvotes: raw.total_upvotes ?? raw.totalUpvotes,
    valoracionRatio: raw.valoracion_ratio ?? raw.valoracionRatio,
    myVote: raw.my_vote ?? raw.myVote ?? null,
  };
}

export async function getComments(params: GetCommentsParams): Promise<Comment[]> {
  const query = new URLSearchParams();
  query.set('target_type', params.targetType);
  query.set('target_id', String(params.targetId));

  const raw = await apiClient.get(`/api/comments?${query.toString()}`);
  return Array.isArray(raw?.data) ? raw.data.map(normalizeComment) : [];
}

export async function createComment(input: CreateCommentInput): Promise<Comment> {
  const raw = await apiClient.post('/api/comments', {
    target_type: input.targetType,
    target_id: input.targetId,
    content: input.content,
  });

  return normalizeComment(raw?.data ?? raw);
}

export async function deleteComment(commentId: number | string) {
  return apiClient.delete(`/api/comments/${commentId}`);
}
