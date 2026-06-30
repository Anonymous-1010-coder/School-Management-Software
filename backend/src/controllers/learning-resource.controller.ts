import { Request, Response, NextFunction } from 'express';
import { learningResourceService } from '../services/learning-resource.service';

export class LearningResourceController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try { const data = await learningResourceService.findAll(req.user!.schoolId!, req.query as any); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async findById(req: Request, res: Response, next: NextFunction) {
    try { const data = await learningResourceService.findById(req.params.id); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async create(req: Request, res: Response, next: NextFunction) {
    try { const data = await learningResourceService.create({ ...req.body, teacherId: req.user!.userId, schoolId: req.user!.schoolId! }); res.status(201).json({ success: true, message: 'Resource uploaded', data }); }
    catch (error) { next(error); }
  }
  async update(req: Request, res: Response, next: NextFunction) {
    try { const data = await learningResourceService.update(req.params.id, req.body); res.json({ success: true, message: 'Resource updated', data }); }
    catch (error) { next(error); }
  }
  async delete(req: Request, res: Response, next: NextFunction) {
    try { await learningResourceService.delete(req.params.id); res.json({ success: true, message: 'Resource deleted' }); }
    catch (error) { next(error); }
  }
  async incrementDownload(req: Request, res: Response, next: NextFunction) {
    try { const data = await learningResourceService.incrementDownload(req.params.id); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async getStats(req: Request, res: Response, next: NextFunction) {
    try { const data = await learningResourceService.getStats(req.user!.schoolId!); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
}

export const learningResourceController = new LearningResourceController();
