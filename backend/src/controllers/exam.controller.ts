import { Request, Response, NextFunction } from 'express';
import { examService } from '../services/exam.service';

export class ExamController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try { const data = await examService.findAll(req.user!.schoolId!, req.query as any); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async findById(req: Request, res: Response, next: NextFunction) {
    try { const data = await examService.findById(req.params.id); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async create(req: Request, res: Response, next: NextFunction) {
    try { const data = await examService.create({ ...req.body, teacherId: req.user!.userId }); res.status(201).json({ success: true, message: 'Exam created', data }); }
    catch (error) { next(error); }
  }
  async update(req: Request, res: Response, next: NextFunction) {
    try { const data = await examService.update(req.params.id, req.body); res.json({ success: true, message: 'Exam updated', data }); }
    catch (error) { next(error); }
  }
  async delete(req: Request, res: Response, next: NextFunction) {
    try { await examService.delete(req.params.id); res.json({ success: true, message: 'Exam deleted' }); }
    catch (error) { next(error); }
  }
  async addQuestion(req: Request, res: Response, next: NextFunction) {
    try { const data = await examService.addQuestion({ ...req.body, teacherId: req.user!.userId }); res.status(201).json({ success: true, message: 'Question added', data }); }
    catch (error) { next(error); }
  }
  async updateQuestion(req: Request, res: Response, next: NextFunction) {
    try { const data = await examService.updateQuestion(req.params.id, req.body); res.json({ success: true, message: 'Question updated', data }); }
    catch (error) { next(error); }
  }
  async deleteQuestion(req: Request, res: Response, next: NextFunction) {
    try { await examService.deleteQuestion(req.params.qid); res.json({ success: true, message: 'Question deleted' }); }
    catch (error) { next(error); }
  }
  async getQuestions(req: Request, res: Response, next: NextFunction) {
    try { const data = await examService.getQuestionsForStudent(req.params.id, req.user!.userId); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async saveAnswers(req: Request, res: Response, next: NextFunction) {
    try { const { answers, timeSpent } = req.body; const data = await examService.saveAnswers(req.params.id, req.user!.userId, answers, timeSpent); res.json({ success: true, message: 'Answers saved', data }); }
    catch (error) { next(error); }
  }
  async submit(req: Request, res: Response, next: NextFunction) {
    try { const { answers, timeSpent } = req.body; const data = await examService.submitExam(req.params.id, req.user!.userId, answers, timeSpent); res.json({ success: true, message: 'Exam submitted', data }); }
    catch (error) { next(error); }
  }
  async getSubmissions(req: Request, res: Response, next: NextFunction) {
    try { const data = await examService.getSubmissions(req.params.id); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async getStats(req: Request, res: Response, next: NextFunction) {
    try { const data = await examService.getStats(req.user!.schoolId!); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
}
export const examController = new ExamController();
