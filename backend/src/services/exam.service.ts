import prisma from '../utils/prisma';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';

export class ExamService {
  async findAll(schoolId: string, query: { classId?: string; subjectId?: string; isCbt?: string }) {
    const where: any = { subject: { class: { schoolId } } };
    if (query.classId) where.classId = query.classId;
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.isCbt !== undefined) where.isCbt = query.isCbt === 'true';
    return prisma.exam.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
        arm: { select: { id: true, name: true } },
        _count: { select: { questions: true, submissions: true, results: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
        arm: { select: { id: true, name: true } },
        questions: { orderBy: { createdAt: 'asc' } },
        _count: { select: { submissions: true, results: true } },
      },
    });
    if (!exam) throw new NotFoundError('Exam not found');
    return exam;
  }

  async create(data: {
    title: string; examType: string; subjectId: string; classId: string; armId?: string;
    term: string; session: string; duration: number; totalMarks?: number; isCbt?: boolean;
    startDate?: string; endDate?: string; teacherId: string;
  }) {
    return prisma.exam.create({
      data: {
        title: data.title, examType: data.examType as any, subjectId: data.subjectId, classId: data.classId,
        armId: data.armId, term: data.term, session: data.session, duration: data.duration,
        totalMarks: data.totalMarks || 100, isCbt: data.isCbt || false,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      } as any,
      include: { subject: true, class: true, questions: true },
    });
  }

  async update(id: string, data: any) {
    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundError('Exam not found');
    return prisma.exam.update({ where: { id }, data, include: { subject: true, class: true } });
  }

  async delete(id: string) {
    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundError('Exam not found');
    await prisma.exam.delete({ where: { id } });
    return { success: true };
  }

  async addQuestion(data: {
    examId: string; teacherId: string; questionText: string; questionType: string;
    options?: string[]; correctAnswer: string; marks?: number;
  }) {
    return prisma.examQuestion.create({
      data: {
        examId: data.examId, teacherId: data.teacherId, questionText: data.questionText,
        questionType: data.questionType as any, options: data.options || [],
        correctAnswer: data.correctAnswer, marks: data.marks || 1,
      } as any,
    });
  }

  async updateQuestion(id: string, data: any) {
    const q = await prisma.examQuestion.findUnique({ where: { id } });
    if (!q) throw new NotFoundError('Question not found');
    return prisma.examQuestion.update({ where: { id }, data });
  }

  async deleteQuestion(id: string) {
    await prisma.examQuestion.delete({ where: { id } });
    return { success: true };
  }

  async getQuestionsForStudent(examId: string, studentId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId }, include: { questions: true } });
    if (!exam) throw new NotFoundError('Exam not found');
    if (!exam.isCbt) throw new BadRequestError('This is not a CBT exam');
    if (!exam.isActive) throw new BadRequestError('Exam is not active');
    const now = new Date();
    if (exam.startDate && now < exam.startDate) throw new BadRequestError('Exam has not started');
    if (exam.endDate && now > exam.endDate) throw new BadRequestError('Exam has ended');

    const existing = await prisma.cBTSubmission.findUnique({ where: { examId_studentId: { examId, studentId } } });
    if (existing && existing.submittedAt) throw new BadRequestError('You have already submitted this exam');

    // Shuffle questions and options
    const questions = exam.questions.map(q => ({
      id: q.id, questionText: q.questionText, questionType: q.questionType,
      options: q.questionType === 'MULTIPLE_CHOICE' ? this.shuffleArray(q.options) : [],
      marks: q.marks,
    }));

    return { exam: { id: exam.id, title: exam.title, duration: exam.duration, totalMarks: exam.totalMarks }, questions: this.shuffleArray(questions) };
  }

  async saveAnswers(examId: string, studentId: string, answers: any[], timeSpent?: number) {
    const existing = await prisma.cBTSubmission.findUnique({ where: { examId_studentId: { examId, studentId } } });
    if (existing) {
      if (existing.submittedAt) throw new BadRequestError('Exam already submitted');
      return prisma.cBTSubmission.update({ where: { id: existing.id }, data: { answers, timeSpent: timeSpent || existing.timeSpent } });
    }
    return prisma.cBTSubmission.create({ data: { examId, studentId, answers } });
  }

  async submitExam(examId: string, studentId: string, answers: any[], timeSpent: number) {
    const exam = await prisma.exam.findUnique({ where: { id: examId }, include: { questions: true } });
    if (!exam) throw new NotFoundError('Exam not found');

    let score = 0;
    for (const answer of answers) {
      const question = exam.questions.find(q => q.id === answer.questionId);
      if (question && question.correctAnswer === answer.answer) {
        score += question.marks;
      }
    }

    return prisma.cBTSubmission.upsert({
      where: { examId_studentId: { examId, studentId } },
      create: { examId, studentId, answers, score, timeSpent, submittedAt: new Date() },
      update: { answers, score, timeSpent, submittedAt: new Date() },
    });
  }

  async getSubmissions(examId: string) {
    return prisma.cBTSubmission.findMany({
      where: { examId },
      include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async getStats(schoolId: string) {
    const [total, active, byType] = await Promise.all([
      prisma.exam.count({ where: { subject: { class: { schoolId } } } }),
      prisma.exam.count({ where: { subject: { class: { schoolId } }, isActive: true } }),
      prisma.exam.groupBy({ by: ['examType'], where: { subject: { class: { schoolId } } }, _count: true }),
    ]);
    return { total, active, byType };
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
export const examService = new ExamService();
