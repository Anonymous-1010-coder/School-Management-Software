import { Request, Response, NextFunction } from 'express';
import { lessonNoteService } from '../services/lesson-note.service';

export class LessonNoteController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try { const data = await lessonNoteService.findAll(req.user!.schoolId!, req.query as any); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async findById(req: Request, res: Response, next: NextFunction) {
    try { const data = await lessonNoteService.findById(req.params.id); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async create(req: Request, res: Response, next: NextFunction) {
    try { const data = await lessonNoteService.create({ ...req.body, teacherId: req.user!.userId }); res.status(201).json({ success: true, message: 'Lesson note created', data }); }
    catch (error) { next(error); }
  }
  async update(req: Request, res: Response, next: NextFunction) {
    try { const data = await lessonNoteService.update(req.params.id, req.body); res.json({ success: true, message: 'Lesson note updated', data }); }
    catch (error) { next(error); }
  }
  async delete(req: Request, res: Response, next: NextFunction) {
    try { await lessonNoteService.delete(req.params.id); res.json({ success: true, message: 'Lesson note deleted' }); }
    catch (error) { next(error); }
  }
  async getStats(req: Request, res: Response, next: NextFunction) {
    try { const data = await lessonNoteService.getStats(req.user!.schoolId!); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
}

export const lessonNoteController = new LessonNoteController();
