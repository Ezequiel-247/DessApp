import { useCallback, useEffect, useState } from 'react';
import { getNovelties, type Novelty, type NoveltyPagination } from '@/entities/Novelty';
import { createPost, updatePost, deletePost, uploadPostImages } from '@/entities/Post';
import { materialVoteApi } from '@/shared/api/materialVoteApi';

const INITIAL_PAGINATION: NoveltyPagination = {
  total: 0,
  limit: 20,
  offset: 0,
  hasMore: false,
};

export function useNovelties() {
  const [novelties, setNovelties] = useState<Novelty[]>([]);
  const [pagination, setPagination] = useState<NoveltyPagination>(INITIAL_PAGINATION);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNovelties = useCallback(async (options: { append?: boolean; offset?: number } = {}) => {
    const append = Boolean(options.append);
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const nextOffset = append ? options.offset ?? 0 : 0;
      const response = await getNovelties({ limit: 30, offset: nextOffset });

      setNovelties((prev) => (append ? [...prev, ...response.data] : response.data));
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar novedades');
      if (!append) {
        setNovelties([]);
        setPagination(INITIAL_PAGINATION);
      }
    } finally {
      if (append) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchNovelties();
  }, [fetchNovelties]);

  const publishPost = useCallback(async (title: string, content: string, files?: File[]) => {
    setIsCreatingPost(true);
    setError(null);

    try {
      let images: string[] = [];
      if (files && files.length > 0) {
        images = await uploadPostImages(files);
      }
      await createPost({ title, content, images });
      await fetchNovelties({ append: false });
    } catch (err: any) {
      setError(err?.message || 'No se pudo publicar el posteo');
      throw err;
    } finally {
      setIsCreatingPost(false);
    }
  }, [fetchNovelties]);

  const loadMore = useCallback(async () => {
    if (!pagination.hasMore || isLoadingMore) return;
    const nextOffset = pagination.offset + pagination.limit;
    await fetchNovelties({ append: true, offset: nextOffset });
  }, [fetchNovelties, isLoadingMore, pagination.hasMore, pagination.limit, pagination.offset]);

  const editPost = useCallback(async (postId: number, title: string, content: string) => {
    setIsUpdatingPost(true);
    setError(null);

    try {
      await updatePost(postId, { title, content });
      await fetchNovelties({ append: false });
    } catch (err: any) {
      setError(err?.message || 'No se pudo editar el posteo');
      throw err;
    } finally {
      setIsUpdatingPost(false);
    }
  }, [fetchNovelties]);

  const removePost = useCallback(async (postId: number) => {
    setIsDeletingPost(true);
    setError(null);

    try {
      await deletePost(postId);
      await fetchNovelties({ append: false });
    } catch (err: any) {
      setError(err?.message || 'No se pudo eliminar el posteo');
      throw err;
    } finally {
      setIsDeletingPost(false);
    }
  }, [fetchNovelties]);

  const voteItem = useCallback(async (targetId: number, targetType: 'post' | 'academic_event', voteType: 'up' | 'down') => {
    setNovelties((prev) =>
      prev.map((n) => {
        if (n.targetId !== targetId || n.targetType !== targetType) return n;

        const currentVote = n.myVote ?? null;
        let newVote: 'up' | 'down' | null = voteType;

        if (currentVote === voteType) {
          newVote = null;
        }

        const likesCount = n.likesCount ?? 0;
        const dislikesCount = n.dislikesCount ?? 0;
        let deltaLikes = 0;
        let deltaDislikes = 0;

        if (currentVote === 'up') deltaLikes = -1;
        if (currentVote === 'down') deltaDislikes = -1;
        if (newVote === 'up') deltaLikes = 1;
        if (newVote === 'down') deltaDislikes = 1;

        const newLikes = Math.max(0, likesCount + deltaLikes);
        const newDislikes = Math.max(0, dislikesCount + deltaDislikes);
        const total = newLikes + newDislikes;
        const ratio = total > 0 ? newLikes / total : 0;

        return {
          ...n,
          likesCount: newLikes,
          dislikesCount: newDislikes,
          valoracionRatio: ratio,
          myVote: newVote,
        };
      })
    );

    try {
      await materialVoteApi.addVote({
        target_type: targetType,
        target_id: targetId,
        is_upvote: voteType === 'up',
      });
    } catch {
      await fetchNovelties({ append: false });
    }
  }, [fetchNovelties]);

  return {
    novelties,
    pagination,
    isLoading,
    isLoadingMore,
    isCreatingPost,
    isUpdatingPost,
    isDeletingPost,
    error,
    publishPost,
    editPost,
    removePost,
    votePost: (postId: number, voteType: 'up' | 'down') => voteItem(postId, 'post', voteType),
    voteAcademicEvent: (recordId: number, voteType: 'up' | 'down') => voteItem(recordId, 'academic_event', voteType),
    loadMore,
    refetch: () => fetchNovelties({ append: false }),
  };
}
