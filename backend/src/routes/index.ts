import { Router } from 'express';
import authRoutes from './auth.routes';
import { authenticate, authorize } from '../middleware/auth';
import { studentController } from '../controllers/student.controller';
import { classController } from '../controllers/class.controller';
import { subjectController } from '../controllers/core.controllers';
import { staffController } from '../controllers/staff.controller';
import { attendanceController } from '../controllers/core.controllers';
import { examController } from '../controllers/exam.controller';
import { resultController } from '../controllers/core.controllers';
import { financeController } from '../controllers/core.controllers';
import { libraryController, hostelController, transportController, clinicController, inventoryController, communicationController, parentController, dashboardController } from '../controllers/core.controllers';
import { armController } from '../controllers/arm.controller';
import { homeworkController } from '../controllers/homework.controller';
import { lessonNoteController } from '../controllers/lesson-note.controller';
import { learningResourceController } from '../controllers/learning-resource.controller';
import { examSessionController } from '../controllers/exam-session.controller';

const router = Router();

router.use('/auth', authRoutes);

router.get('/dashboard/stats', authenticate, dashboardController.getStats.bind(dashboardController));

// Students
router.get('/students', authenticate, studentController.findAll.bind(studentController));
router.get('/students/stats', authenticate, studentController.getStats.bind(studentController));
router.get('/students/:id', authenticate, studentController.findById.bind(studentController));
router.post('/students', authenticate, authorize('SUPER_ADMIN', 'SCHOOL_OWNER', 'PRINCIPAL', 'VICE_PRINCIPAL', 'RECEPTIONIST'), studentController.create.bind(studentController));
router.put('/students/:id', authenticate, authorize('SUPER_ADMIN', 'SCHOOL_OWNER', 'PRINCIPAL', 'VICE_PRINCIPAL'), studentController.update.bind(studentController));
router.delete('/students/:id', authenticate, authorize('SUPER_ADMIN', 'SCHOOL_OWNER', 'PRINCIPAL'), studentController.delete.bind(studentController));
router.post('/students/:id/promote', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL'), studentController.promote.bind(studentController));

// Staff
router.get('/staff', authenticate, staffController.findAll.bind(staffController));
router.get('/staff/:id', authenticate, staffController.findById.bind(staffController));
router.post('/staff', authenticate, authorize('SUPER_ADMIN', 'SCHOOL_OWNER', 'PRINCIPAL'), staffController.create.bind(staffController));
router.put('/staff/:id', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL'), staffController.update.bind(staffController));
router.delete('/staff/:id', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL'), staffController.delete.bind(staffController));

// Teachers (alias for staff with TEACHER role)
router.get('/teachers', authenticate, (req, res, next) => { req.query.role = 'TEACHER'; staffController.findAll(req, res, next); });

// Parents
router.get('/parents', authenticate, parentController.findAll.bind(parentController));
router.get('/parents/:id', authenticate, parentController.findById.bind(parentController));
router.post('/parents', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL'), parentController.create.bind(parentController));
router.post('/parents/:id/link-student', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL'), parentController.linkStudent.bind(parentController));

// Users (all users for user management)
router.get('/users', authenticate, authorize('SUPER_ADMIN', 'SCHOOL_OWNER', 'PRINCIPAL', 'VICE_PRINCIPAL'), async (req, res, next) => {
  try {
    const { prisma } = require('../utils/prisma');
    const data = await prisma.user.findMany({
      where: { schoolId: req.user!.schoolId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, isVerified: true, lastLogin: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

// Classes
router.get('/classes', authenticate, classController.findAll.bind(classController));
router.get('/classes/stats', authenticate, classController.getStats.bind(classController));
router.get('/classes/:id', authenticate, classController.findById.bind(classController));
router.post('/classes', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'), classController.create.bind(classController));
router.put('/classes/:id', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'), classController.update.bind(classController));
router.delete('/classes/:id', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL'), classController.delete.bind(classController));

// Arms
router.get('/arms', authenticate, armController.findAll.bind(armController));
router.get('/arms/:id', authenticate, armController.findById.bind(armController));
router.post('/arms', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'), armController.create.bind(armController));
router.put('/arms/:id', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'), armController.update.bind(armController));
router.delete('/arms/:id', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL'), armController.delete.bind(armController));

// Subjects
router.get('/subjects', authenticate, subjectController.findAll.bind(subjectController));
router.get('/subjects/stats', authenticate, subjectController.getStats.bind(subjectController));
router.get('/subjects/:id', authenticate, subjectController.findById.bind(subjectController));
router.post('/subjects', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'), subjectController.create.bind(subjectController));
router.put('/subjects/:id', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'), subjectController.update.bind(subjectController));
router.delete('/subjects/:id', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL'), subjectController.delete.bind(subjectController));
router.post('/subjects/:id/assign-teacher', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'), subjectController.assignTeacher.bind(subjectController));

// Timetable
router.get('/timetable', authenticate, async (req, res, next) => {
  try {
    const { prisma } = require('../utils/prisma');
    const { classId, armId, dayOfWeek } = req.query;
    const where: any = {};
    if (classId) where.classId = classId;
    if (armId) where.armId = armId;
    if (dayOfWeek) where.dayOfWeek = Number(dayOfWeek);
    const data = await prisma.timetable.findMany({ where, include: { subject: { select: { id: true, name: true, code: true } }, class: { select: { id: true, name: true } }, arm: { select: { id: true, name: true } } }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});
router.post('/timetable', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'), async (req, res, next) => {
  try {
    const { prisma } = require('../utils/prisma');
    const data = await prisma.timetable.create({ data: req.body, include: { subject: { select: { id: true, name: true } } } });
    res.status(201).json({ success: true, message: 'Schedule added', data });
  } catch (error) { next(error); }
});

// Attendance
router.get('/attendance', authenticate, attendanceController.findAll.bind(attendanceController));
router.post('/attendance/mark', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'), attendanceController.mark.bind(attendanceController));
router.post('/attendance/bulk', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'), attendanceController.markBulk.bind(attendanceController));
router.get('/attendance/stats', authenticate, attendanceController.getStats.bind(attendanceController));

// Exams
router.get('/exams', authenticate, examController.findAll.bind(examController));
router.get('/exams/stats', authenticate, examController.getStats.bind(examController));
router.get('/exams/:id', authenticate, examController.findById.bind(examController));
router.post('/exams', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'), examController.create.bind(examController));
router.put('/exams/:id', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'), examController.update.bind(examController));
router.delete('/exams/:id', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL'), examController.delete.bind(examController));

// Exam Questions (CBT)
router.get('/exams/:id/questions', authenticate, examController.getQuestions.bind(examController));
router.post('/exams/:id/questions', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'), examController.addQuestion.bind(examController));
router.put('/exams/questions/:id', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'), examController.updateQuestion.bind(examController));
router.delete('/exams/questions/:qid', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'), examController.deleteQuestion.bind(examController));
router.post('/exams/:id/save-answers', authenticate, examController.saveAnswers.bind(examController));
router.post('/exams/:id/submit', authenticate, examController.submit.bind(examController));
router.get('/exams/:id/submissions', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'), examController.getSubmissions.bind(examController));

// Exam Sessions (Anti-cheat)
router.post('/exam-sessions', authenticate, examSessionController.createSession.bind(examSessionController));
router.post('/exam-sessions/:sessionId/events', authenticate, examSessionController.logEvent.bind(examSessionController));
router.put('/exam-sessions/:sessionId/activity', authenticate, examSessionController.updateActivity.bind(examSessionController));
router.put('/exam-sessions/:sessionId/end', authenticate, examSessionController.endSession.bind(examSessionController));
router.get('/exam-sessions/:sessionId/events', authenticate, examSessionController.getEvents.bind(examSessionController));
router.get('/exam-sessions/exam/:examId/log', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'), examSessionController.getExamSessionLog.bind(examSessionController));
router.get('/exam-sessions/exam/:examId/suspicious', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'), examSessionController.getSuspiciousEvents.bind(examSessionController));

// Results
router.get('/results', authenticate, resultController.findAll.bind(resultController));
router.get('/results/:id', authenticate, resultController.findById.bind(resultController));
router.post('/results', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'), resultController.create.bind(resultController));
router.put('/results/:id', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'), resultController.update.bind(resultController));
router.delete('/results/:id', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL'), resultController.delete.bind(resultController));
router.post('/results/bulk', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'), resultController.createBulk.bind(resultController));
router.post('/results/publish', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'), resultController.publish.bind(resultController));
router.get('/results/report-card/:studentId/:term/:session', authenticate, resultController.generateReportCard.bind(resultController));
router.get('/results/stats', authenticate, resultController.getStats.bind(resultController));

// Homework
router.get('/homework', authenticate, homeworkController.findAll.bind(homeworkController));
router.get('/homework/stats', authenticate, homeworkController.getStats.bind(homeworkController));
router.get('/homework/:id', authenticate, homeworkController.findById.bind(homeworkController));
router.post('/homework', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'), homeworkController.create.bind(homeworkController));
router.put('/homework/:id', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'), homeworkController.update.bind(homeworkController));
router.delete('/homework/:id', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'), homeworkController.delete.bind(homeworkController));
router.post('/homework/:id/submit', authenticate, homeworkController.submit.bind(homeworkController));
router.put('/homework/submissions/:id/grade', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'), homeworkController.grade.bind(homeworkController));

// Lesson Notes
router.get('/lesson-notes', authenticate, lessonNoteController.findAll.bind(lessonNoteController));
router.get('/lesson-notes/stats', authenticate, lessonNoteController.getStats.bind(lessonNoteController));
router.get('/lesson-notes/:id', authenticate, lessonNoteController.findById.bind(lessonNoteController));
router.post('/lesson-notes', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'), lessonNoteController.create.bind(lessonNoteController));
router.put('/lesson-notes/:id', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'), lessonNoteController.update.bind(lessonNoteController));
router.delete('/lesson-notes/:id', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'), lessonNoteController.delete.bind(lessonNoteController));

// Learning Resources
router.get('/learning-resources', authenticate, learningResourceController.findAll.bind(learningResourceController));
router.get('/learning-resources/stats', authenticate, learningResourceController.getStats.bind(learningResourceController));
router.get('/learning-resources/:id', authenticate, learningResourceController.findById.bind(learningResourceController));
router.post('/learning-resources', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'), learningResourceController.create.bind(learningResourceController));
router.put('/learning-resources/:id', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'), learningResourceController.update.bind(learningResourceController));
router.delete('/learning-resources/:id', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'), learningResourceController.delete.bind(learningResourceController));
router.post('/learning-resources/:id/download', authenticate, learningResourceController.incrementDownload.bind(learningResourceController));

// Finance
router.get('/finance/fee-structures', authenticate, financeController.getFeeStructures.bind(financeController));
router.post('/finance/fee-structures', authenticate, authorize('SUPER_ADMIN', 'SCHOOL_OWNER', 'PRINCIPAL', 'ACCOUNTANT'), financeController.createFeeStructure.bind(financeController));
router.put('/finance/fee-structures/:id', authenticate, authorize('SUPER_ADMIN', 'SCHOOL_OWNER', 'PRINCIPAL', 'ACCOUNTANT'), financeController.updateFeeStructure.bind(financeController));
router.delete('/finance/fee-structures/:id', authenticate, authorize('SUPER_ADMIN', 'SCHOOL_OWNER', 'PRINCIPAL', 'ACCOUNTANT'), financeController.deleteFeeStructure.bind(financeController));
router.get('/finance/payments', authenticate, financeController.getPayments.bind(financeController));
router.post('/finance/payments', authenticate, authorize('SUPER_ADMIN', 'ACCOUNTANT', 'SCHOOL_OWNER', 'PRINCIPAL'), financeController.recordPayment.bind(financeController));
router.get('/finance/expenses', authenticate, financeController.getExpenses.bind(financeController));
router.post('/finance/expenses', authenticate, authorize('SUPER_ADMIN', 'SCHOOL_OWNER', 'PRINCIPAL', 'ACCOUNTANT'), financeController.createExpense.bind(financeController));
router.get('/finance/payroll', authenticate, authorize('SUPER_ADMIN', 'SCHOOL_OWNER', 'PRINCIPAL', 'ACCOUNTANT'), financeController.getPayrolls.bind(financeController));
router.post('/finance/payroll', authenticate, authorize('SUPER_ADMIN', 'SCHOOL_OWNER', 'PRINCIPAL', 'ACCOUNTANT'), financeController.runPayroll.bind(financeController));
router.get('/finance/stats', authenticate, financeController.getStats.bind(financeController));

// Library
router.get('/library', authenticate, libraryController.findAll.bind(libraryController));
router.post('/library', authenticate, authorize('SUPER_ADMIN', 'LIBRARIAN', 'PRINCIPAL'), libraryController.create.bind(libraryController));
router.put('/library/:id', authenticate, authorize('SUPER_ADMIN', 'LIBRARIAN', 'PRINCIPAL'), libraryController.update.bind(libraryController));
router.delete('/library/:id', authenticate, authorize('SUPER_ADMIN', 'LIBRARIAN', 'PRINCIPAL'), libraryController.delete.bind(libraryController));
router.post('/library/borrow', authenticate, authorize('SUPER_ADMIN', 'LIBRARIAN', 'PRINCIPAL'), libraryController.borrow.bind(libraryController));
router.post('/library/return/:id', authenticate, authorize('SUPER_ADMIN', 'LIBRARIAN', 'PRINCIPAL'), libraryController.returnBook.bind(libraryController));
router.get('/library/stats', authenticate, libraryController.getStats.bind(libraryController));

// Hostel
router.get('/hostel', authenticate, hostelController.findAll.bind(hostelController));
router.post('/hostel', authenticate, authorize('SUPER_ADMIN', 'HOSTEL_MANAGER', 'PRINCIPAL'), hostelController.create.bind(hostelController));
router.post('/hostel/rooms', authenticate, authorize('SUPER_ADMIN', 'HOSTEL_MANAGER', 'PRINCIPAL'), hostelController.addRoom.bind(hostelController));
router.post('/hostel/allocate', authenticate, authorize('SUPER_ADMIN', 'HOSTEL_MANAGER', 'PRINCIPAL'), hostelController.allocate.bind(hostelController));
router.post('/hostel/deallocate/:id', authenticate, authorize('SUPER_ADMIN', 'HOSTEL_MANAGER', 'PRINCIPAL'), hostelController.deallocate.bind(hostelController));
router.get('/hostel/stats', authenticate, hostelController.getStats.bind(hostelController));

// Transport
router.get('/transport', authenticate, transportController.findAll.bind(transportController));
router.post('/transport', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL'), transportController.create.bind(transportController));
router.post('/transport/allocate', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL'), transportController.allocate.bind(transportController));
router.post('/transport/deallocate/:id', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL'), transportController.deallocate.bind(transportController));

// Clinic
router.get('/clinic', authenticate, clinicController.findAll.bind(clinicController));
router.post('/clinic', authenticate, authorize('SUPER_ADMIN', 'NURSE', 'PRINCIPAL'), clinicController.create.bind(clinicController));
router.get('/clinic/stats', authenticate, clinicController.getStats.bind(clinicController));

// Inventory
router.get('/inventory', authenticate, inventoryController.findAll.bind(inventoryController));
router.post('/inventory', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL'), inventoryController.create.bind(inventoryController));
router.put('/inventory/:id', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL'), inventoryController.update.bind(inventoryController));
router.delete('/inventory/:id', authenticate, authorize('SUPER_ADMIN', 'PRINCIPAL'), inventoryController.delete.bind(inventoryController));
router.get('/inventory/stats', authenticate, inventoryController.getStats.bind(inventoryController));

// Communication
router.get('/communication/inbox', authenticate, communicationController.inbox.bind(communicationController));
router.get('/communication/sent', authenticate, communicationController.sent.bind(communicationController));
router.post('/communication/send', authenticate, communicationController.send.bind(communicationController));
router.put('/communication/read/:id', authenticate, communicationController.markRead.bind(communicationController));
router.get('/communication/notifications', authenticate, communicationController.getNotifications.bind(communicationController));
router.post('/communication/notifications', authenticate, communicationController.createNotification.bind(communicationController));
router.put('/communication/notifications/:id/read', authenticate, communicationController.markNotificationRead.bind(communicationController));

export default router;
