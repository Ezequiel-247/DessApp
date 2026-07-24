import { apiClient } from './apiClient';

export type VoteTargetType = "material" | "post" | "comment" | "academic_event";

export interface VotePayload {
  target_type: VoteTargetType;
  target_id: string | number;
  is_upvote: boolean;
}

export const materialVoteApi = {
  addVote: async (data: VotePayload) => {
    return apiClient.post('/api/votes', data);
  }
};
