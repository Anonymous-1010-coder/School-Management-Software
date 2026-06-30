import { Request, Response, NextFunction } from 'express';
import { homeworkService } from '../services/homework.service';

export class HomeworkController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try { const data = await homeworkService.findAll(req.user!.schoolId!, req.query as any); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async findById(req: Request, res: Response, next: NextFunction) {
    try { const data = await homeworkService.findById(req.params.id); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async create(req: Request, res: Response, next: NextFunction) {
    try { const data = await homeworkService.create({ ...req.body, teacherId: req.user!.userId }); res.status(201).json({ success: true, message: 'Homework created', data }); }
    catch (error) { next(error); }
  }
  async update(req: Request, res: Response, next: NextFunction) {
    try { const data = await homeworkService.update(req.params.id, req.body); res.json({ success: true, message: 'Homework updated', data }); }
    catch (error) { next(error); }
  }
  async delete(req: Request, res: Response, next: NextFunction) {
    try { await homeworkService.delete(req.params.id); res.json({ success: true, message: 'Homework deleted' }); }
    catch (error) { next(error); }
  }
  async submit(req: Request, res: Response, next: NextFunction) {
    try { const data = await homeworkService.submit({ ...req.body, studentId: req.user!.userId }); res.json({ success: true, message: 'Submitted', data }); }
    catch (error) { next(error); }
  }
  async grade(req: Request, res: Response, next: NextFunction) {
    try { const data = await homeworkService.gradeSubmission(req.params.id, req.body); res.json({ success: true, message: 'Graded', data }); }
    catch (error) { next(error); }
  }
  async getStats(req: Request, res: Response, next: NextFunction) {
    try { const data = await homeworkService.getStats(req.user!.schoolId!); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
}

export const homeworkController = new HomeworkController();
