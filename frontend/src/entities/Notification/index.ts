export {
  type Notification,
  NOTIFICATION_TYPE,
  type NotificationType,
} from "./model/notification";
export {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  createNotification,
} from "./api/notificationApi";
export { mockNotifications } from "./model/mock";
