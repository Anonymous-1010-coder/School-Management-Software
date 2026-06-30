import { Request, Response, NextFunction } from 'express';
import { staffService } from '../services/staff.service';

export class StaffController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try { const { page, limit, search, role } = req.query; const data = await staffService.findAll(req.user!.schoolId!, { page: Number(page) || 1, limit: Number(limit) || 10, search: search as string, role: role as string }); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async findById(req: Request, res: Response, next: NextFunction) {
    try { const data = await staffService.findById(req.params.id); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async create(req: Request, res: Response, next: NextFunction) {
    try { const data = await staffService.create({ ...req.body, schoolId: req.user!.schoolId! }); res.status(201).json({ success: true, message: 'Staff created', data }); }
    catch (error) { next(error); }
  }
  async update(req: Request, res: Response, next: NextFunction) {
    try { const data = await staffService.update(req.params.id, req.body); res.json({ success: true, message: 'Staff updated', data }); }
    catch (error) { next(error); }
  }
  async delete(req: Request, res: Response, next: NextFunction) {
    try { await staffService.delete(req.params.id); res.json({ success: true, message: 'Staff deactivated' }); }
    catch (error) { next(error); }
  }
}
export const staffController = new StaffController();
