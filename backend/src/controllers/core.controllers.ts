import { Request, Response, NextFunction } from 'express';
import { subjectService } from '../services/subject.service';
import { attendanceService } from '../services/attendance.service';
import { resultService } from '../services/result.service';
import { financeService } from '../services/finance.service';
import { libraryService, hostelService, transportService, clinicService, inventoryService, communicationService, parentService, dashboardService } from '../services/core.services';

// Subject
export class SubjectController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try { const data = await subjectService.findAll(req.user!.schoolId!, req.query.classId as string); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async findById(req: Request, res: Response, next: NextFunction) {
    try { const data = await subjectService.findById(req.params.id); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async create(req: Request, res: Response, next: NextFunction) {
    try { const data = await subjectService.create({ ...req.body, schoolId: req.user!.schoolId! }); res.status(201).json({ success: true, message: 'Subject created', data }); }
    catch (error) { next(error); }
  }
  async update(req: Request, res: Response, next: NextFunction) {
    try { const data = await subjectService.update(req.params.id, req.body); res.json({ success: true, message: 'Subject updated', data }); }
    catch (error) { next(error); }
  }
  async delete(req: Request, res: Response, next: NextFunction) {
    try { await subjectService.delete(req.params.id); res.json({ success: true, message: 'Subject deleted' }); }
    catch (error) { next(error); }
  }
  async assignTeacher(req: Request, res: Response, next: NextFunction) {
    try { const data = await subjectService.assignTeacher(req.params.id, req.body.teacherId); res.json({ success: true, message: 'Teacher assigned', data }); }
    catch (error) { next(error); }
  }
  async getStats(req: Request, res: Response, next: NextFunction) {
    try { const data = await subjectService.getStats(req.user!.schoolId!); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
}
export const subjectController = new SubjectController();

// Attendance
export class AttendanceController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try { const data = await attendanceService.findAll(req.user!.schoolId!, req.query as any); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async mark(req: Request, res: Response, next: NextFunction) {
    try { const data = await attendanceService.mark({ ...req.body, markedBy: req.user!.userId }); res.json({ success: true, message: 'Attendance marked', data }); }
    catch (error) { next(error); }
  }
  async markBulk(req: Request, res: Response, next: NextFunction) {
    try { const data = await attendanceService.markBulk(req.body.records, req.user!.userId); res.json({ success: true, message: 'Attendance marked', data }); }
    catch (error) { next(error); }
  }
  async getStats(req: Request, res: Response, next: NextFunction) {
    try { const data = await attendanceService.getStats(req.user!.schoolId!, req.query.date as string); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
}
export const attendanceController = new AttendanceController();

// Results
export class ResultController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try { const data = await resultService.findAll(req.user!.schoolId!, req.query as any); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async findById(req: Request, res: Response, next: NextFunction) {
    try { const data = await resultService.findById(req.params.id); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async create(req: Request, res: Response, next: NextFunction) {
    try { const data = await resultService.create(req.body); res.status(201).json({ success: true, message: 'Result added', data }); }
    catch (error) { next(error); }
  }
  async update(req: Request, res: Response, next: NextFunction) {
    try { const data = await resultService.update(req.params.id, req.body); res.json({ success: true, message: 'Result updated', data }); }
    catch (error) { next(error); }
  }
  async delete(req: Request, res: Response, next: NextFunction) {
    try { await resultService.delete(req.params.id); res.json({ success: true, message: 'Result deleted' }); }
    catch (error) { next(error); }
  }
  async createBulk(req: Request, res: Response, next: NextFunction) {
    try { const data = await resultService.createBulk(req.body.results); res.json({ success: true, message: 'Results added', data }); }
    catch (error) { next(error); }
  }
  async publish(req: Request, res: Response, next: NextFunction) {
    try { const { examId, classId } = req.body; const data = await resultService.publish(examId, classId); res.json({ success: true, message: 'Results published', data }); }
    catch (error) { next(error); }
  }
  async generateReportCard(req: Request, res: Response, next: NextFunction) {
    try { const { studentId, term, session } = req.params; const data = await resultService.generateReportCard(studentId, term, session); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async getStats(req: Request, res: Response, next: NextFunction) {
    try { const data = await resultService.getStats(req.user!.schoolId!); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
}
export const resultController = new ResultController();

// Finance
export class FinanceController {
  async getFeeStructures(req: Request, res: Response, next: NextFunction) {
    try { const data = await financeService.getFeeStructures(req.user!.schoolId!, req.query.classId as string); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async createFeeStructure(req: Request, res: Response, next: NextFunction) {
    try { const data = await financeService.createFeeStructure({ ...req.body, schoolId: req.user!.schoolId! }); res.status(201).json({ success: true, message: 'Fee structure created', data }); }
    catch (error) { next(error); }
  }
  async updateFeeStructure(req: Request, res: Response, next: NextFunction) {
    try { const data = await financeService.updateFeeStructure(req.params.id, req.body); res.json({ success: true, message: 'Fee structure updated', data }); }
    catch (error) { next(error); }
  }
  async deleteFeeStructure(req: Request, res: Response, next: NextFunction) {
    try { await financeService.deleteFeeStructure(req.params.id); res.json({ success: true, message: 'Fee structure deleted' }); }
    catch (error) { next(error); }
  }
  async getPayments(req: Request, res: Response, next: NextFunction) {
    try { const data = await financeService.getPayments(req.user!.schoolId!, req.query as any); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async recordPayment(req: Request, res: Response, next: NextFunction) {
    try { const data = await financeService.recordPayment(req.body); res.json({ success: true, message: 'Payment recorded', data }); }
    catch (error) { next(error); }
  }
  async getExpenses(req: Request, res: Response, next: NextFunction) {
    try { const data = await financeService.getExpenses(req.user!.schoolId!); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async createExpense(req: Request, res: Response, next: NextFunction) {
    try { const data = await financeService.createExpense({ ...req.body, approvedBy: req.user!.userId, schoolId: req.user!.schoolId! }); res.status(201).json({ success: true, message: 'Expense recorded', data }); }
    catch (error) { next(error); }
  }
  async getPayrolls(req: Request, res: Response, next: NextFunction) {
    try { const { month, year } = req.query; const data = await financeService.getPayrolls(req.user!.schoolId!, month ? Number(month) : undefined, year ? Number(year) : undefined); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async runPayroll(req: Request, res: Response, next: NextFunction) {
    try { const data = await financeService.runPayroll({ ...req.body, schoolId: req.user!.schoolId! }); res.json({ success: true, message: 'Payroll processed', data }); }
    catch (error) { next(error); }
  }
  async getStats(req: Request, res: Response, next: NextFunction) {
    try { const data = await financeService.getStats(req.user!.schoolId!); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
}
export const financeController = new FinanceController();

// Library
export class LibraryController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try { const data = await libraryService.findAll(req.user!.schoolId!, req.query as any); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async create(req: Request, res: Response, next: NextFunction) {
    try { const data = await libraryService.create({ ...req.body, schoolId: req.user!.schoolId! }); res.status(201).json({ success: true, message: 'Book added', data }); }
    catch (error) { next(error); }
  }
  async update(req: Request, res: Response, next: NextFunction) {
    try { const data = await libraryService.update(req.params.id, req.body); res.json({ success: true, message: 'Book updated', data }); }
    catch (error) { next(error); }
  }
  async delete(req: Request, res: Response, next: NextFunction) {
    try { await libraryService.delete(req.params.id); res.json({ success: true, message: 'Book deleted' }); }
    catch (error) { next(error); }
  }
  async borrow(req: Request, res: Response, next: NextFunction) {
    try { const { bookId, studentId, dueDate } = req.body; const data = await libraryService.borrow(bookId, studentId, dueDate); res.json({ success: true, message: 'Book borrowed', data }); }
    catch (error) { next(error); }
  }
  async returnBook(req: Request, res: Response, next: NextFunction) {
    try { const data = await libraryService.return(req.params.id); res.json({ success: true, message: 'Book returned', data }); }
    catch (error) { next(error); }
  }
  async getStats(req: Request, res: Response, next: NextFunction) {
    try { const data = await libraryService.getStats(req.user!.schoolId!); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
}
export const libraryController = new LibraryController();

// Hostel
export class HostelController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try { const data = await hostelService.findAll(req.user!.schoolId!); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async create(req: Request, res: Response, next: NextFunction) {
    try { const data = await hostelService.create({ ...req.body, schoolId: req.user!.schoolId! }); res.status(201).json({ success: true, message: 'Hostel created', data }); }
    catch (error) { next(error); }
  }
  async addRoom(req: Request, res: Response, next: NextFunction) {
    try { const data = await hostelService.addRoom(req.body); res.json({ success: true, message: 'Room added', data }); }
    catch (error) { next(error); }
  }
  async allocate(req: Request, res: Response, next: NextFunction) {
    try { const data = await hostelService.allocate(req.body); res.json({ success: true, message: 'Allocated', data }); }
    catch (error) { next(error); }
  }
  async deallocate(req: Request, res: Response, next: NextFunction) {
    try { const data = await hostelService.deallocate(req.params.id); res.json({ success: true, message: 'Deallocated', data }); }
    catch (error) { next(error); }
  }
  async getStats(req: Request, res: Response, next: NextFunction) {
    try { const data = await hostelService.getStats(req.user!.schoolId!); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
}
export const hostelController = new HostelController();

// Transport
export class TransportController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try { const data = await transportService.findAll(req.user!.schoolId!); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async create(req: Request, res: Response, next: NextFunction) {
    try { const data = await transportService.create({ ...req.body, schoolId: req.user!.schoolId! }); res.status(201).json({ success: true, message: 'Vehicle added', data }); }
    catch (error) { next(error); }
  }
  async allocate(req: Request, res: Response, next: NextFunction) {
    try { const data = await transportService.allocate(req.body); res.json({ success: true, message: 'Allocated', data }); }
    catch (error) { next(error); }
  }
  async deallocate(req: Request, res: Response, next: NextFunction) {
    try { const data = await transportService.deallocate(req.params.id); res.json({ success: true, message: 'Deallocated' }); }
    catch (error) { next(error); }
  }
}
export const transportController = new TransportController();

// Clinic
export class ClinicController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try { const data = await clinicService.findAll(req.user!.schoolId!); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async create(req: Request, res: Response, next: NextFunction) {
    try { const data = await clinicService.create({ ...req.body, treatedBy: req.user!.userId }); res.status(201).json({ success: true, message: 'Record created', data }); }
    catch (error) { next(error); }
  }
  async getStats(req: Request, res: Response, next: NextFunction) {
    try { const data = await clinicService.getStats(req.user!.schoolId!); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
}
export const clinicController = new ClinicController();

// Inventory
export class InventoryController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try { const data = await inventoryService.findAll(req.user!.schoolId!); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async create(req: Request, res: Response, next: NextFunction) {
    try { const data = await inventoryService.create({ ...req.body, schoolId: req.user!.schoolId! }); res.status(201).json({ success: true, message: 'Item added', data }); }
    catch (error) { next(error); }
  }
  async update(req: Request, res: Response, next: NextFunction) {
    try { const data = await inventoryService.update(req.params.id, req.body); res.json({ success: true, message: 'Item updated', data }); }
    catch (error) { next(error); }
  }
  async delete(req: Request, res: Response, next: NextFunction) {
    try { await inventoryService.delete(req.params.id); res.json({ success: true, message: 'Item deleted' }); }
    catch (error) { next(error); }
  }
  async getStats(req: Request, res: Response, next: NextFunction) {
    try { const data = await inventoryService.getStats(req.user!.schoolId!); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
}
export const inventoryController = new InventoryController();

// Communication
export class CommunicationController {
  async send(req: Request, res: Response, next: NextFunction) {
    try { const data = await communicationService.send({ ...req.body, senderId: req.user!.userId }); res.json({ success: true, message: 'Message sent', data }); }
    catch (error) { next(error); }
  }
  async inbox(req: Request, res: Response, next: NextFunction) {
    try { const data = await communicationService.getInbox(req.user!.userId); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async sent(req: Request, res: Response, next: NextFunction) {
    try { const data = await communicationService.getSent(req.user!.userId); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async markRead(req: Request, res: Response, next: NextFunction) {
    try { const data = await communicationService.markRead(req.params.id); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try { const data = await communicationService.getNotifications(req.user!.userId); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async createNotification(req: Request, res: Response, next: NextFunction) {
    try { const data = await communicationService.createNotification(req.body); res.status(201).json({ success: true, message: 'Notification sent', data }); }
    catch (error) { next(error); }
  }
  async markNotificationRead(req: Request, res: Response, next: NextFunction) {
    try { const data = await communicationService.markNotificationRead(req.params.id); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
}
export const communicationController = new CommunicationController();

// Parent
export class ParentController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try { const data = await parentService.findAll(req.user!.schoolId!); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async findById(req: Request, res: Response, next: NextFunction) {
    try { const data = await parentService.findById(req.params.id); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
  async create(req: Request, res: Response, next: NextFunction) {
    try { const data = await parentService.create({ ...req.body, schoolId: req.user!.schoolId! }); res.status(201).json({ success: true, message: 'Parent created', data }); }
    catch (error) { next(error); }
  }
  async linkStudent(req: Request, res: Response, next: NextFunction) {
    try { const data = await parentService.linkStudent(req.params.id, req.body.studentId); res.json({ success: true, message: 'Student linked', data }); }
    catch (error) { next(error); }
  }
}
export const parentController = new ParentController();

// Dashboard
export class DashboardController {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try { const data = await dashboardService.getStats(req.user!.schoolId!); res.json({ success: true, data }); }
    catch (error) { next(error); }
  }
}
export const dashboardController = new DashboardController();
