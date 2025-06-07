import { Router } from 'express';
import { createPin, getPins, updatePin, deletePin } from '../controllers/pinsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All pins routes require authentication
router.use(authenticateToken);

router.post('/', createPin);
router.get('/', getPins);
router.put('/:pinId', updatePin);
router.delete('/:pinId', deletePin);

export default router;