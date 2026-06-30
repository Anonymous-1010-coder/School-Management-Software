import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema, verifyOtpSchema, changePasswordSchema } from '@sms/shared';
import type { RegisterRequest } from '@sms/shared';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body) as unknown as RegisterRequest;
      const result = await authService.register(data);
      res.status(201).json({ success: true, message: 'Registration successful', data: result });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);
      res.json({ success: true, message: 'Login successful', data: result });
    } catch (error) {
      next(error);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const data = verifyOtpSchema.parse(req.body);
      const result = await authService.verifyOtp(data.email, data.otp);
      res.json({ success: true, message: 'OTP verified', data: result });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ success: false, message: 'Refresh token is required' });
        return;
      }
      const tokens = await authService.refreshToken(refreshToken);
      res.json({ success: true, message: 'Token refreshed', data: tokens });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user) {
        await authService.logout(req.user.userId);
      }
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = forgotPasswordSchema.parse(req.body);
      await authService.forgotPassword(data.email);
      res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = resetPasswordSchema.parse(req.body);
      await authService.resetPassword(data.token, data.password);
      res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = changePasswordSchema.parse(req.body);
      await authService.changePassword(req.user!.userId, data.currentPassword, data.newPassword);
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async enableTwoFactor(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.enableTwoFactor(req.user!.userId);
      res.json({ success: true, message: '2FA enabled', data: result });
    } catch (error) {
      next(error);
    }
  }

  async disableTwoFactor(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.disableTwoFactor(req.user!.userId);
      res.json({ success: true, message: '2FA disabled' });
    } catch (error) {
      next(error);
    }
  }

  async verifyTwoFactor(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      const isValid = await authService.verifyTwoFactorToken(req.user!.userId, token);
      res.json({ success: true, message: isValid ? 'Token valid' : 'Token invalid', data: { valid: isValid } });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { prisma } = await import('../utils/prisma');
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: {
          id: true, email: true, firstName: true, lastName: true, otherName: true,
          phone: true, role: true, gender: true, dateOfBirth: true, address: true,
          avatar: true, isVerified: true, isTwoFactorEnabled: true, isActive: true,
          lastLogin: true, createdAt: true, updatedAt: true,
          schoolId: true,
          studentProfile: true,
          staffProfile: true,
          parentProfile: true,
        },
      });
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
