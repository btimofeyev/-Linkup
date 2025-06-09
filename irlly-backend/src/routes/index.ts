import { Router } from 'express';
import contactsRoutes from './contacts';
import circlesRoutes from './circles';
import pinsRoutes from './pins';
import meetupsRoutes from './meetups';
import rsvpRoutes from './rsvp';
import feedRoutes from './feed';
import notificationsRoutes from './notifications';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Linkup API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes - auth now handled by Supabase
router.use('/contacts', contactsRoutes);
router.use('/circles', circlesRoutes);
router.use('/pins', pinsRoutes);
router.use('/meetups', meetupsRoutes);
router.use('/rsvp', rsvpRoutes);
router.use('/feed', feedRoutes);
router.use('/notifications', notificationsRoutes);

export default router;