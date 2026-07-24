export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  targetType?: string | null;
  targetId?: number | null;
  read: boolean;
  createdAt: string;
}

export const NOTIFICATION_TYPE = {
  INFO: "info",
  WARNING: "warning",
  SUCCESS: "success",
  ERROR: "error",
  CONTENT_VOTE: "content_vote",
  POST_COMMENT: "post_comment",
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];
