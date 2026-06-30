import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

router.post('/register', rateLimit, authController.register.bind(authController));
router.post('/login', rateLimit, authController.login.bind(authController));
router.post('/verify-otp', rateLimit, authController.verifyOtp.bind(authController));
router.post('/refresh-token', authController.refreshToken.bind(authController));
router.post('/logout', authenticate, authController.logout.bind(authController));
router.post('/forgot-password', rateLimit, authController.forgotPassword.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));
router.post('/change-password', authenticate, authController.changePassword.bind(authController));
router.post('/2fa/enable', authenticate, authController.enableTwoFactor.bind(authController));
router.post('/2fa/disable', authenticate, authController.disableTwoFactor.bind(authController));
router.post('/2fa/verify', authenticate, authController.verifyTwoFactor.bind(authController));
router.get('/profile', authenticate, authController.getProfile.bind(authController));

export default router;
