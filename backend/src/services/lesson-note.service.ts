import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export class LessonNoteService {
  async findAll(schoolId: string, query: { classId?: string; subjectId?: string; term?: string; session?: string; week?: number; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const where: any = { class: { schoolId } };
    if (query.classId) where.classId = query.classId;
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.term) where.term = query.term;
    if (query.session) where.session = query.session;
    if (query.week) where.week = query.week;
    const [data, total] = await Promise.all([
      prisma.lessonNote.findMany({
        where, skip: (page - 1) * limit, take: limit,
        include: {
          subject: { select: { id: true, name: true, code: true } },
          class: { select: { id: true, name: true } },
          teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
        orderBy: [{ week: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.lessonNote.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const note = await prisma.lessonNote.findUnique({
      where: { id },
      include: { subject: true, class: true, teacher: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
    if (!note) throw new NotFoundError('Lesson note not found');
    return note;
  }

  async create(data: {
    subjectId: string; teacherId: string; classId: string;
    topic: string; objectives: string; content: string; materials?: string;
    week: number; term: string; session: string;
  }) {
    return prisma.lessonNote.create({ data, include: { subject: { select: { name: true } }, class: { select: { name: true } } } });
  }

  async update(id: string, data: any) {
    const note = await prisma.lessonNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundError('Lesson note not found');
    return prisma.lessonNote.update({ where: { id }, data });
  }

  async delete(id: string) {
    await prisma.lessonNote.delete({ where: { id } });
    return { success: true };
  }

  async getStats(schoolId: string) {
    const [total, byClass] = await Promise.all([
      prisma.lessonNote.count({ where: { class: { schoolId } } }),
      prisma.lessonNote.groupBy({ by: ['classId'], where: { class: { schoolId } }, _count: true }),
    ]);
    return { total, byClass };
  }
}

export const lessonNoteService = new LessonNoteService();
