import { Router } from 'express';
import { 
  createOrUpdateRSVP, 
  getRSVPs, 
  getUserRSVP, 
  deleteRSVP 
} from '../controllers/rsvpController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All RSVP routes require authentication
router.use(authenticateToken);

router.post('/', createOrUpdateRSVP);
router.get('/', getRSVPs);
router.get('/:meetupId', getUserRSVP);
router.delete('/:meetupId', deleteRSVP);

export default router;