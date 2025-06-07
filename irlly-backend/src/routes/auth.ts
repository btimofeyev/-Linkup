import { Router } from 'express';
import { 
  sendVerificationCodeHandler, 
  verifyCodeAndLogin, 
  updateProfile, 
  getProfile 
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.'
  }
});

const smsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // limit each IP to 1 SMS per minute
  message: {
    success: false,
    error: 'Please wait before requesting another verification code.'
  }
});

// Public routes
router.post('/send-code', smsLimiter, sendVerificationCodeHandler);
router.post('/verify', authLimiter, verifyCodeAndLogin);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

export default router;