import { Router } from 'express';
import { syncContacts, getContacts, getRegisteredContacts } from '../controllers/contactsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All contacts routes require authentication
router.use(authenticateToken);

router.post('/sync', syncContacts);
router.get('/', getContacts);
router.get('/registered', getRegisteredContacts);

export default router;