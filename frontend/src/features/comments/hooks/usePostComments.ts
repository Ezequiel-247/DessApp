import { useCallback, useEffect, useState } from 'react';
import { createComment, deleteComment, getComments, type Comment, type CommentTargetType } from '@/entities/Comment';
import { materialVoteApi } from '@/shared/api/materialVoteApi';

interface UsePostCommentsOptions {
  enabled?: boolean;
}

export function usePostComments(
  targetType: CommentTargetType | null,
  targetId: number | null,
  options: UsePostCommentsOptions = {}
) {
  const enabled = Boolean(options.enabled);

  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!targetType || !targetId || targetId <= 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getComments({ targetType, targetId });
      setComments(data);
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar los comentarios');
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  }, [targetId, targetType]);

  useEffect(() => {
    if (!enabled) return;
    loadComments();
  }, [enabled, loadComments]);

  const addComment = useCallback(async (content: string) => {
    if (!targetType || !targetId || targetId <= 0) {
      throw new Error('Target de comentario inválido');
    }

    setIsCreating(true);
    setError(null);

    try {
      await createComment({ targetType, targetId, content });
      await loadComments();
    } catch (err: any) {
      setError(err?.message || 'No se pudo crear el comentario');
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, [loadComments, targetId, targetType]);

  const removeComment = useCallback(async (commentId: number) => {
    setIsDeleting(true);
    setError(null);

    try {
      await deleteComment(commentId);
      await loadComments();
    } catch (err: any) {
      setError(err?.message || 'No se pudo eliminar el comentario');
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [loadComments]);

  const voteComment = useCallback(async (commentId: number, voteType: 'up' | 'down') => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;

        const currentVote = c.myVote ?? null;
        let newVote: 'up' | 'down' | null = voteType;
        if (currentVote === voteType) newVote = null;

        const likesCount = c.likesCount ?? 0;
        const dislikesCount = c.dislikesCount ?? 0;
        let dl = 0, dd = 0;
        if (currentVote === 'up') dl = -1;
        if (currentVote === 'down') dd = -1;
        if (newVote === 'up') dl = 1;
        if (newVote === 'down') dd = 1;

        const newLikes = Math.max(0, likesCount + dl);
        const newDislikes = Math.max(0, dislikesCount + dd);
        const total = newLikes + newDislikes;
        const ratio = total > 0 ? newLikes / total : 0;

        return {
          ...c,
          likesCount: newLikes,
          dislikesCount: newDislikes,
          valoracionRatio: ratio,
          myVote: newVote,
        };
      })
    );

    try {
      await materialVoteApi.addVote({
        target_type: 'comment',
        target_id: commentId,
        is_upvote: voteType === 'up',
      });
    } catch {
      await loadComments();
    }
  }, [loadComments]);

  return {
    comments,
    isLoading,
    isCreating,
    isDeleting,
    error,
    addComment,
    removeComment,
    voteComment,
    refetch: loadComments,
  };
}
