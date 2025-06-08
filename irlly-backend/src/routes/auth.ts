import { Router } from 'express';
import { 
  sendVerificationCodeHandler, 
  verifyCodeAndLogin,
  checkUsernameAvailability,
  sendVerificationForRegistration,
  verifyAndCreateUser,
  sendVerificationForLogin,
  verifyAndLogin,
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

// Public routes - Original phone-based auth (kept for backward compatibility)
router.post('/send-code', smsLimiter, sendVerificationCodeHandler);
router.post('/verify', authLimiter, verifyCodeAndLogin);

// Public routes - New username + phone hybrid auth
router.post('/check-availability', authLimiter, checkUsernameAvailability);
router.post('/register/send-code', smsLimiter, sendVerificationForRegistration);
router.post('/register/verify', authLimiter, verifyAndCreateUser);
router.post('/login/send-code', smsLimiter, sendVerificationForLogin);
router.post('/login/verify', authLimiter, verifyAndLogin);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

export default router;