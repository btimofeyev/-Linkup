import { Router } from 'express';
import { getFeed } from '../controllers/feedController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All feed routes require authentication
router.use(authenticateToken);

router.get('/', getFeed);

export default router;