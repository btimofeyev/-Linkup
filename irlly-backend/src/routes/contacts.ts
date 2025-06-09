import { Router } from 'express';
import { syncContacts, getContacts, getRegisteredContacts, getFriends, searchUsers, addContactByUsername, debugUsers } from '../controllers/contactsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All contacts routes require authentication
router.use(authenticateToken);

router.post('/sync', syncContacts);
router.get('/', getContacts);
router.get('/registered', getRegisteredContacts);
router.get('/friends', getFriends);
router.get('/search', searchUsers);
router.post('/add', addContactByUsername);
router.get('/debug-users', debugUsers);

export default router;