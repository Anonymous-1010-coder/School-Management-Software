import { Request, Response, NextFunction } from 'express';
import { studentService } from '../services/student.service';

export class StudentController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, classId, armId, status } = req.query;
      const result = await studentService.findAll(req.user!.schoolId!, {
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search: search as string,
        classId: classId as string,
        armId: armId as string,
        status: status as string,
      });
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await studentService.findById(req.params.id);
      res.json({ success: true, data: student });
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await studentService.create({ ...req.body, schoolId: req.user!.schoolId! });
      res.status(201).json({ success: true, message: 'Student created successfully', data: student });
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await studentService.update(req.params.id, req.body);
      res.json({ success: true, message: 'Student updated successfully', data: student });
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await studentService.delete(req.params.id);
      res.json({ success: true, message: 'Student deleted successfully' });
    } catch (error) { next(error); }
  }

  async promote(req: Request, res: Response, next: NextFunction) {
    try {
      const { newClassId, newArmId } = req.body;
      const student = await studentService.promote(req.params.id, newClassId, newArmId);
      res.json({ success: true, message: 'Student promoted successfully', data: student });
    } catch (error) { next(error); }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await studentService.getStats(req.user!.schoolId!);
      res.json({ success: true, data: stats });
    } catch (error) { next(error); }
  }
}

export const studentController = new StudentController();
