import { Router } from 'express';
import { createMeetup, getMeetups, updateMeetup, deleteMeetup } from '../controllers/meetupsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All meetups routes require authentication
router.use(authenticateToken);

router.post('/', createMeetup);
router.get('/', getMeetups);
router.put('/:meetupId', updateMeetup);
router.delete('/:meetupId', deleteMeetup);

export default router;