import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';
import { v4 as uuidv4 } from 'uuid';

export class ExamSessionService {
  async createSession(data: {
    examId: string; studentId: string;
    ipAddress?: string; userAgent?: string; deviceInfo?: string;
    os?: string; browser?: string; screenResolution?: string;
  }) {
    const token = uuidv4();
    return prisma.examSession.upsert({
      where: { examId_studentId: { examId: data.examId, studentId: data.studentId } },
      update: {
        token, isActive: true, reconnectCount: { increment: 1 },
        loginTime: new Date(), lastActivity: new Date(),
        ipAddress: data.ipAddress, userAgent: data.userAgent,
        deviceInfo: data.deviceInfo, os: data.os,
        browser: data.browser, screenResolution: data.screenResolution,
      },
      create: {
        examId: data.examId, studentId: data.studentId, token,
        ipAddress: data.ipAddress, userAgent: data.userAgent,
        deviceInfo: data.deviceInfo, os: data.os,
        browser: data.browser, screenResolution: data.screenResolution,
      },
    });
  }

  async logEvent(sessionId: string, eventType: string, details?: string, severity: string = 'INFO') {
    return prisma.examSessionEvent.create({
      data: { sessionId, eventType, details, severity },
    });
  }

  async updateActivity(sessionId: string) {
    return prisma.examSession.update({
      where: { id: sessionId },
      data: { lastActivity: new Date() },
    });
  }

  async endSession(sessionId: string) {
    return prisma.examSession.update({
      where: { id: sessionId },
      data: { isActive: false, logoutTime: new Date() },
    });
  }

  async getEvents(sessionId: string) {
    return prisma.examSessionEvent.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getSuspiciousEvents(examId: string, threshold: number = 5) {
    const sessions = await prisma.examSession.findMany({
      where: { examId, isActive: true },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        events: { where: { severity: 'WARNING' } },
      },
    });
    return sessions.filter(s => s.events.length >= threshold);
  }

  async getExamSessionLog(examId: string) {
    return prisma.examSession.findMany({
      where: { examId },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        events: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
      orderBy: { loginTime: 'desc' },
    });
  }
}

export const examSessionService = new ExamSessionService();
