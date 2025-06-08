import { Router } from 'express';
import { 
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount
} from '../controllers/notificationsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All notification routes require authentication
router.use(authenticateToken);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadNotificationCount);
router.put('/:notificationId/read', markNotificationAsRead);
router.put('/mark-all-read', markAllNotificationsAsRead);

export default router;