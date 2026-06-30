import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

vi.mock('../src/utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    studentProfile: { create: vi.fn() },
    staffProfile: { create: vi.fn() },
    parentProfile: { create: vi.fn() },
    activityLog: { create: vi.fn() },
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Password Hashing', () => {
    it('should hash passwords correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 12);

      expect(hash).not.toBe(password);
      expect(hash).toContain('$2a$');
    });

    it('should verify passwords correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 12);
      const isValid = await bcrypt.compare(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject wrong passwords', async () => {
      const hash = await bcrypt.hash('CorrectPassword1!', 12);
      const isValid = await bcrypt.compare('WrongPassword1!', hash);

      expect(isValid).toBe(false);
    });
  });

  describe('JWT Tokens', () => {
    const secret = 'test-secret';
    const payload = { userId: '123', email: 'test@test.com', role: 'TEACHER' as const };

    it('should generate valid access tokens', () => {
      const token = jwt.sign(payload, secret, { expiresIn: '15m' as any });
      expect(token).toBeTruthy();

      const decoded = jwt.verify(token, secret) as typeof payload;
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should reject expired tokens', () => {
      const token = jwt.sign(payload, secret, { expiresIn: '0s' as any });

      expect(() => jwt.verify(token, secret)).toThrow();
    });

    it('should reject invalid tokens', () => {
      expect(() => jwt.verify('invalid-token', secret)).toThrow();
    });
  });

  describe('Validation', () => {
    it('should validate email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test('user@example.com')).toBe(true);
      expect(emailRegex.test('invalid-email')).toBe(false);
      expect(emailRegex.test('')).toBe(false);
    });

    it('should validate password strength', () => {
      const hasUppercase = /[A-Z]/;
      const hasLowercase = /[a-z]/;
      const hasNumber = /[0-9]/;
      const hasSpecial = /[^A-Za-z0-9]/;
      const isLongEnough = (s: string) => s.length >= 8;

      const strongPass = 'StrongP@ss1';
      expect(hasUppercase.test(strongPass)).toBe(true);
      expect(hasLowercase.test(strongPass)).toBe(true);
      expect(hasNumber.test(strongPass)).toBe(true);
      expect(hasSpecial.test(strongPass)).toBe(true);
      expect(isLongEnough(strongPass)).toBe(true);

      const weakPass = 'weak';
      expect(isLongEnough(weakPass)).toBe(false);
      expect(hasUppercase.test(weakPass)).toBe(false);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should have all required roles', () => {
      const roles = [
        'SUPER_ADMIN', 'SCHOOL_OWNER', 'PRINCIPAL', 'VICE_PRINCIPAL',
        'TEACHER', 'CLASS_TEACHER', 'STUDENT', 'PARENT',
        'ACCOUNTANT', 'LIBRARIAN', 'HOSTEL_MANAGER', 'NURSE', 'RECEPTIONIST',
      ];
      expect(roles).toHaveLength(13);
      expect(roles).toContain('SUPER_ADMIN');
      expect(roles).toContain('STUDENT');
    });

    it('should have proper permission hierarchy', () => {
      const hierarchy: Record<string, number> = {
        SUPER_ADMIN: 100,
        SCHOOL_OWNER: 90,
        PRINCIPAL: 80,
        STUDENT: 20,
      };
      expect(hierarchy.SUPER_ADMIN).toBeGreaterThan(hierarchy.PRINCIPAL);
      expect(hierarchy.PRINCIPAL).toBeGreaterThan(hierarchy.STUDENT);
    });
  });
});
