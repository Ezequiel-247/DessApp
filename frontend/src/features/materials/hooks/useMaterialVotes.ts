import { useState, useCallback } from 'react';
import { materialVoteApi } from '@/shared/api';

export function useMaterialVotes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vote = useCallback(async (materialId: string, voteType: 'up' | 'down') => {
    setLoading(true);
    setError(null);
    try {
      const response = await materialVoteApi.addVote({
        target_type: "material",
        target_id: materialId,
        is_upvote: voteType === 'up',
      });
      return response?.data?.action || 'added';
    } catch (err: any) {
      setError(err.message ?? 'Error al registrar el voto');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { vote, loading, error };
}
