import { apiClient } from '@/shared/api/apiClient';
import type { Novelty, NoveltiesResponse, NoveltyPagination } from '../model/novelty';

export interface GetNoveltiesParams {
  limit?: number;
  offset?: number;
}

const DEFAULT_PAGINATION: NoveltyPagination = {
  total: 0,
  limit: 20,
  offset: 0,
  hasMore: false,
};

function normalizeNovelty(raw: any): Novelty {
  return {
    id: raw.id,
    type: raw.type,
    postId: raw.postId,
    targetType: raw.targetType,
    targetId: raw.targetId,
    commentCount: raw.commentCount,
    eventType: raw.eventType,
    status: raw.status,
    title: raw.title,
    content: raw.content,
    subjectCode: raw.subjectCode,
    author: raw.author,
    date: raw.date,
    likesCount: raw.likes_count ?? raw.likesCount,
    dislikesCount: raw.dislikes_count ?? raw.dislikesCount,
    valoracionRatio: raw.valoracion_ratio ?? raw.valoracionRatio,
    myVote: raw.my_vote ?? raw.myVote,
  };
}

export async function getNovelties(params: GetNoveltiesParams = {}): Promise<NoveltiesResponse> {
  const query = new URLSearchParams();

  if (typeof params.limit === 'number') query.set('limit', String(params.limit));
  if (typeof params.offset === 'number') query.set('offset', String(params.offset));

  const endpoint = query.toString() ? `/api/novelties?${query.toString()}` : '/api/novelties';
  const raw = await apiClient.get(endpoint);

  const data = Array.isArray(raw?.data) ? raw.data.map(normalizeNovelty) : [];
  const pagination = raw?.pagination ?? DEFAULT_PAGINATION;

  return {
    data,
    pagination,
  };
}
