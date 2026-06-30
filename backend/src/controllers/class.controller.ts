import { Request, Response, NextFunction } from 'express';
import { classService } from '../services/class.service';

export class ClassController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try { const data = await classService.findAll(req.user!.schoolId!); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async findById(req: Request, res: Response, next: NextFunction) {
    try { const data = await classService.findById(req.params.id); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async create(req: Request, res: Response, next: NextFunction) {
    try { const data = await classService.create({ ...req.body, schoolId: req.user!.schoolId! }); res.status(201).json({ success: true, message: 'Class created', data }); }
    catch (error) { next(error); }
  }
  async update(req: Request, res: Response, next: NextFunction) {
    try { const data = await classService.update(req.params.id, req.body); res.json({ success: true, message: 'Class updated', data }); }
    catch (error) { next(error); }
  }
  async delete(req: Request, res: Response, next: NextFunction) {
    try { await classService.delete(req.params.id); res.json({ success: true, message: 'Class deleted' }); }
    catch (error) { next(error); }
  }
  async getStats(req: Request, res: Response, next: NextFunction) {
    try { const data = await classService.getStats(req.user!.schoolId!); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
}
export const classController = new ClassController();
