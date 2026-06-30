import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export class HomeworkService {
  async findAll(schoolId: string, query: { classId?: string; armId?: string; subjectId?: string; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const where: any = { class: { schoolId } };
    if (query.classId) where.classId = query.classId;
    if (query.armId) where.armId = query.armId;
    if (query.subjectId) where.subjectId = query.subjectId;
    const [data, total] = await Promise.all([
      prisma.homework.findMany({
        where, skip: (page - 1) * limit, take: limit,
        include: {
          subject: { select: { id: true, name: true, code: true } },
          class: { select: { id: true, name: true } },
          arm: { select: { id: true, name: true } },
          teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
          _count: { select: { submissions: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.homework.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const hw = await prisma.homework.findUnique({
      where: { id },
      include: {
        subject: true, class: true, arm: true,
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        submissions: { include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } } },
      },
    });
    if (!hw) throw new NotFoundError('Homework not found');
    return hw;
  }

  async create(data: {
    subjectId: string; teacherId: string; classId: string; armId?: string;
    title: string; description: string; dueDate: string; maxScore?: number;
  }) {
    return prisma.homework.create({
      data: {
        subjectId: data.subjectId, teacherId: data.teacherId, classId: data.classId,
        armId: data.armId, title: data.title, description: data.description,
        dueDate: new Date(data.dueDate), maxScore: data.maxScore || 100,
      },
      include: { subject: { select: { name: true } }, class: { select: { name: true } } },
    });
  }

  async update(id: string, data: any) {
    const hw = await prisma.homework.findUnique({ where: { id } });
    if (!hw) throw new NotFoundError('Homework not found');
    if (data.dueDate) data.dueDate = new Date(data.dueDate);
    return prisma.homework.update({ where: { id }, data });
  }

  async delete(id: string) {
    await prisma.homework.delete({ where: { id } });
    return { success: true };
  }

  async submit(data: { homeworkId: string; studentId: string; content?: string; attachments?: string[] }) {
    return prisma.homeworkSubmission.create({
      data: {
        homeworkId: data.homeworkId, studentId: data.studentId,
        content: data.content, attachments: data.attachments || [],
      },
      include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
  }

  async gradeSubmission(id: string, data: { score: number; feedback?: string }) {
    const sub = await prisma.homeworkSubmission.findUnique({ where: { id } });
    if (!sub) throw new NotFoundError('Submission not found');
    return prisma.homeworkSubmission.update({
      where: { id },
      data: { score: data.score, feedback: data.feedback, gradedAt: new Date() },
    });
  }

  async getStats(schoolId: string) {
    const [total, active] = await Promise.all([
      prisma.homework.count({ where: { class: { schoolId } } }),
      prisma.homework.count({ where: { class: { schoolId }, isActive: true, dueDate: { gte: new Date() } } }),
    ]);
    return { total, active };
  }
}

export const homeworkService = new HomeworkService();
