import { Router } from 'express';
import { 
  createCircle, 
  getCircles, 
  updateCircle, 
  deleteCircle, 
  addContactsToCircle, 
  removeContactFromCircle 
} from '../controllers/circlesController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All circles routes require authentication
router.use(authenticateToken);

router.post('/', createCircle);
router.get('/', getCircles);
router.put('/:circleId', updateCircle);
router.delete('/:circleId', deleteCircle);
router.post('/:circleId/contacts', addContactsToCircle);
router.delete('/:circleId/contacts/:contactId', removeContactFromCircle);

export default router;