import { Router } from 'express';
import { syncContacts, getContacts, getRegisteredContacts, getFriends, searchUsers, sendFriendRequest, getFriendRequests, respondToFriendRequest, debugUsers } from '../controllers/contactsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All contacts routes require authentication
router.use(authenticateToken);

router.post('/sync', syncContacts);
router.get('/', getContacts);
router.get('/registered', getRegisteredContacts);
router.get('/friends', getFriends);
router.get('/search', searchUsers);
router.post('/friend-request', sendFriendRequest);
router.get('/friend-requests', getFriendRequests);
router.post('/friend-request/respond', respondToFriendRequest);
router.get('/debug-users', debugUsers);

export default router;