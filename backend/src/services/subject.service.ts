import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export class SubjectService {
  async findAll(schoolId: string, classId?: string) {
    const where: any = { schoolId };
    if (classId) where.classId = classId;
    return prisma.subject.findMany({
      where,
      include: {
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        class: { select: { id: true, name: true } },
        _count: { select: { exams: true, lessonNotes: true, homeworks: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: { teacher: { include: { user: { select: { firstName: true, lastName: true } } } }, class: true, _count: { select: { exams: true, lessonNotes: true, homeworks: true } } },
    });
    if (!subject) throw new NotFoundError('Subject not found');
    return subject;
  }

  async create(data: { name: string; code: string; subjectType?: string; creditUnit?: number; classId: string; teacherId?: string; schoolId: string }) {
    return prisma.subject.create({ data: { ...data, subjectType: data.subjectType as any || 'CORE', creditUnit: data.creditUnit || 1 } as any, include: { teacher: { include: { user: { select: { firstName: true, lastName: true } } } }, class: true } });
  }

  async update(id: string, data: any) {
    const subject = await prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundError('Subject not found');
    return prisma.subject.update({ where: { id }, data, include: { teacher: { include: { user: { select: { firstName: true, lastName: true } } } }, class: true } });
  }

  async delete(id: string) {
    const subject = await prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundError('Subject not found');
    await prisma.subject.delete({ where: { id } });
    return { success: true };
  }

  async assignTeacher(subjectId: string, teacherId: string) {
    return prisma.subject.update({ where: { id: subjectId }, data: { teacherId }, include: { teacher: { include: { user: { select: { firstName: true, lastName: true } } } } } });
  }

  async getStats(schoolId: string) {
    const [total, subjects] = await Promise.all([
      prisma.subject.count({ where: { schoolId } }),
      prisma.subject.findMany({ where: { schoolId }, include: { _count: { select: { exams: true, lessonNotes: true } } } }),
    ]);
    return { total, withTeacher: subjects.filter(s => s.teacherId).length, withoutTeacher: subjects.filter(s => !s.teacherId).length };
  }
}
export const subjectService = new SubjectService();
