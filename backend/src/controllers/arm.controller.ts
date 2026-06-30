import { Request, Response, NextFunction } from 'express';
import { armService } from '../services/arm.service';

export class ArmController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try { const data = await armService.findAll(req.user!.schoolId!, req.query.classId as string); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async findById(req: Request, res: Response, next: NextFunction) {
    try { const data = await armService.findById(req.params.id); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async create(req: Request, res: Response, next: NextFunction) {
    try { const data = await armService.create(req.body); res.status(201).json({ success: true, message: 'Arm created', data }); }
    catch (error) { next(error); }
  }
  async update(req: Request, res: Response, next: NextFunction) {
    try { const data = await armService.update(req.params.id, req.body); res.json({ success: true, message: 'Arm updated', data }); }
    catch (error) { next(error); }
  }
  async delete(req: Request, res: Response, next: NextFunction) {
    try { await armService.delete(req.params.id); res.json({ success: true, message: 'Arm deleted' }); }
    catch (error) { next(error); }
  }
}

export const armController = new ArmController();
