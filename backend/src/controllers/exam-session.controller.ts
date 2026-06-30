import { Request, Response, NextFunction } from 'express';
import { examSessionService } from '../services/exam-session.service';

export class ExamSessionController {
  async createSession(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await examSessionService.createSession({
        ...req.body, studentId: req.user!.userId,
        ipAddress: req.ip, userAgent: req.headers['user-agent'],
      });
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async logEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await examSessionService.logEvent(req.params.sessionId, req.body.eventType, req.body.details, req.body.severity);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async updateActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await examSessionService.updateActivity(req.params.sessionId);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async endSession(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await examSessionService.endSession(req.params.sessionId);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await examSessionService.getEvents(req.params.sessionId);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async getExamSessionLog(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await examSessionService.getExamSessionLog(req.params.examId);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async getSuspiciousEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const threshold = Number(req.query.threshold) || 5;
      const data = await examSessionService.getSuspiciousEvents(req.params.examId, threshold);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }
}

export const examSessionController = new ExamSessionController();
