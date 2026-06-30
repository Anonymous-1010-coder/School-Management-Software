import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import prisma from '../utils/prisma';
import config from '../config';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '../utils/errors';
import { sendOtpEmail, sendWelcomeEmail, sendPasswordResetEmail } from '../utils/email';
import logger from '../utils/logger';
import type { Role } from '@prisma/client';
import type {
  LoginRequest,
  RegisterRequest,
  AuthTokens,
  TokenPayload,
  LoginResponse,
  EnableTwoFactorResponse,
} from '@sms/shared';

export class AuthService {
  async register(data: RegisterRequest): Promise<LoginResponse> {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    let schoolId: string | null = null;
    if (data.role === 'SCHOOL_OWNER' || data.role === 'SUPER_ADMIN') {
      if (data.schoolCode) {
        const school = await prisma.school.findUnique({ where: { code: data.schoolCode } });
        if (school) schoolId = school.id;
      }
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role as Role,
        schoolId,
      },
    });

    if (data.role === 'STUDENT') {
      const admissionNumber = `STU${String(Date.now()).slice(-6)}`;
      await prisma.studentProfile.create({
        data: {
          userId: user.id,
          admissionNumber,
          session: '2024/2025',
        },
      });
    }

    if (data.role === 'PARENT') {
      await prisma.parentProfile.create({
        data: {
          userId: user.id,
        },
      });
    }

    if (['TEACHER', 'CLASS_TEACHER', 'PRINCIPAL', 'VICE_PRINCIPAL', 'ACCOUNTANT', 'LIBRARIAN', 'HOSTEL_MANAGER', 'NURSE', 'RECEPTIONIST'].includes(data.role)) {
      const staffNumber = `STF${String(Date.now()).slice(-6)}`;
      await prisma.staffProfile.create({
        data: {
          userId: user.id,
          staffNumber,
        },
      });
    }

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role as Role,
      schoolId: user.schoolId || undefined,
    });

    await this.updateRefreshToken(user.id, tokens.refreshToken);

    try {
      await sendWelcomeEmail(user.email, user.firstName);
    } catch (error) {
      logger.warn('Failed to send welcome email:', error);
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as Role,
        schoolId: user.schoolId || undefined,
        isVerified: user.isVerified,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      },
      tokens,
    };
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    await this.logActivity(user.id, 'LOGIN', 'User', user.id, { email: user.email });

    // Single session: invalidate all existing sessions by clearing refresh token
    await prisma.examSession.deleteMany({ where: { studentId: user.id } });
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: null },
    });

    if (user.isTwoFactorEnabled) {
      const otp = authenticator.generate(authenticator.generateSecret());
      const otpExpiresAt = new Date(Date.now() + config.otp.expiresIn * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: { otp, otpExpiresAt },
      });

      try {
        await sendOtpEmail(user.email, otp);
      } catch (error) {
        logger.warn('Failed to send OTP email:', error);
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role as Role,
          schoolId: user.schoolId || undefined,
          isVerified: user.isVerified,
          isTwoFactorEnabled: true,
        },
        tokens: { accessToken: '', refreshToken: '' },
      };
    }

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role as Role,
      schoolId: user.schoolId || undefined,
    });

    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as Role,
        schoolId: user.schoolId || undefined,
        isVerified: user.isVerified,
        isTwoFactorEnabled: false,
      },
      tokens,
    };
  }

  async verifyOtp(email: string, otp: string): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.otp || !user.otpExpiresAt) {
      throw new BadRequestError('No OTP requested');
    }

    if (new Date() > user.otpExpiresAt) {
      throw new BadRequestError('OTP has expired');
    }

    if (user.otp !== otp) {
      throw new BadRequestError('Invalid OTP');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { otp: null, otpExpiresAt: null, isVerified: true },
    });

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role as Role,
      schoolId: user.schoolId || undefined,
    });

    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as Role,
        schoolId: user.schoolId || undefined,
        isVerified: true,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      },
      tokens,
    };
  }

  async refreshToken(token: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

      if (!user || !user.isActive || user.refreshToken !== token) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const tokens = this.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role as Role,
        schoolId: user.schoolId || undefined,
      });

      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Refresh token expired');
      }
      throw error;
    }
  }

  async logout(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return;
    }

    const resetToken = jwt.sign({ userId: user.id }, config.jwt.secret, { expiresIn: '1h' as any });
    const resetTokenExpiresAt = new Date(Date.now() + 3600000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiresAt },
    });

    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (error) {
      logger.warn('Failed to send password reset email:', error);
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

      if (!user || user.resetToken !== token) {
        throw new BadRequestError('Invalid reset token');
      }

      if (user.resetTokenExpiresAt && new Date() > user.resetTokenExpiresAt) {
        throw new BadRequestError('Reset token has expired');
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiresAt: null,
          refreshToken: null,
        },
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new BadRequestError('Invalid reset token');
      }
      throw error;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestError('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, refreshToken: null },
    });
  }

  async enableTwoFactor(userId: string): Promise<EnableTwoFactorResponse> {
    const secret = authenticator.generateSecret();
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const otpauth = authenticator.keyuri(user.email, config.twoFactor.appName, secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauth);

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret, isTwoFactorEnabled: true },
    });

    return { secret, qrCodeUrl };
  }

  async disableTwoFactor(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: null, isTwoFactorEnabled: false },
    });
  }

  async verifyTwoFactorToken(userId: string, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new NotFoundError('2FA not configured');
    }

    return authenticator.verify({ token, secret: user.twoFactorSecret });
  }

  private generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as any,
    });

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }

  private async logActivity(userId: string, action: string, resource: string, resourceId: string, details?: Record<string, unknown>): Promise<void> {
    await prisma.activityLog.create({
      data: { userId, action, resource, resourceId, details: details as any || {} },
    });
  }
}

export const authService = new AuthService();
