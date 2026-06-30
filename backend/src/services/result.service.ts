import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export class ResultService {
  async findAll(schoolId: string, query: { examId?: string; classId?: string; subjectId?: string; studentId?: string; term?: string; session?: string }) {
    const where: any = {};
    if (query.examId) where.examId = query.examId;
    if (query.classId) where.classId = query.classId;
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.studentId) where.studentId = query.studentId;
    if (query.term) where.term = query.term;
    if (query.session) where.session = query.session;
    return prisma.result.findMany({
      where,
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        exam: { select: { id: true, title: true, examType: true } },
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
      },
      orderBy: [{ session: 'desc' }, { term: 'desc' }],
    });
  }

  async findById(id: string) {
    const result = await prisma.result.findUnique({
      where: { id },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        exam: { select: { id: true, title: true, examType: true } },
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
      },
    });
    if (!result) throw new NotFoundError('Result not found');
    return result;
  }

  async update(id: string, data: { score?: number; grade?: string; point?: number; remark?: string }) {
    const existing = await prisma.result.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Result not found');
    return prisma.result.update({ where: { id }, data, include: { student: { include: { user: { select: { firstName: true, lastName: true } } } }, exam: true, subject: true } });
  }

  async delete(id: string) {
    const existing = await prisma.result.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Result not found');
    await prisma.result.delete({ where: { id } });
  }

  async create(data: { studentId: string; examId: string; subjectId: string; classId: string; score: number; grade?: string; point?: number; remark?: string; term: string; session: string }) {
    return prisma.result.upsert({
      where: { studentId_examId_subjectId: { studentId: data.studentId, examId: data.examId, subjectId: data.subjectId } },
      create: data as any,
      update: { score: data.score, grade: data.grade, point: data.point, remark: data.remark, isPublished: false },
      include: { student: { include: { user: { select: { firstName: true, lastName: true } } } }, exam: true, subject: true },
    });
  }

  async createBulk(results: any[]) {
    const created = [];
    for (const r of results) {
      created.push(await this.create(r));
    }
    return created;
  }

  async publish(examId: string, classId: string) {
    await prisma.result.updateMany({ where: { examId, classId }, data: { isPublished: true } });
    return { success: true };
  }

  async generateReportCard(studentId: string, term: string, session: string) {
    const results = await prisma.result.findMany({
      where: { studentId, term, session },
      include: { subject: true, exam: true },
    });
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: { user: true, currentClass: true, currentArm: true },
    });
    const totalScore = results.reduce((a, r) => a + r.score, 0);
    const average = results.length ? (totalScore / results.length) : 0;
    return { student, results, totalScore, average, totalSubjects: results.length, term, session };
  }

  async getStats(schoolId: string) {
    const [total, classes] = await Promise.all([
      prisma.result.count(),
      prisma.result.groupBy({ by: ['classId'], _count: true }),
    ]);
    return { total, classes: classes.length };
  }
}
export const resultService = new ResultService();
