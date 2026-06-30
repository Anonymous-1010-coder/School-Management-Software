import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export class LearningResourceService {
  async findAll(schoolId: string, query: { classId?: string; subjectId?: string; term?: string; session?: string; topic?: string; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 12;
    const where: any = { schoolId, isPublished: true };
    if (query.classId) where.classId = query.classId;
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.term) where.term = query.term;
    if (query.session) where.session = query.session;
    if (query.topic) where.topic = { contains: query.topic, mode: 'insensitive' };
    const [data, total] = await Promise.all([
      prisma.learningResource.findMany({
        where, skip: (page - 1) * limit, take: limit,
        include: {
          subject: { select: { id: true, name: true, code: true } },
          class: { select: { id: true, name: true } },
          teacher: { include: { user: { select: { firstName: true, lastName: true, avatar: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.learningResource.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const resource = await prisma.learningResource.findUnique({
      where: { id },
      include: {
        subject: true, class: true, arm: true,
        teacher: { include: { user: { select: { firstName: true, lastName: true, avatar: true } } } },
      },
    });
    if (!resource) throw new NotFoundError('Resource not found');
    return resource;
  }

  async create(data: any) {
    return prisma.learningResource.create({
      data,
      include: { subject: { select: { name: true } }, class: { select: { name: true } } },
    });
  }

  async update(id: string, data: any) {
    const resource = await prisma.learningResource.findUnique({ where: { id } });
    if (!resource) throw new NotFoundError('Resource not found');
    return prisma.learningResource.update({ where: { id }, data });
  }

  async delete(id: string) {
    await prisma.learningResource.delete({ where: { id } });
    return { success: true };
  }

  async incrementDownload(id: string) {
    return prisma.learningResource.update({ where: { id }, data: { downloads: { increment: 1 } } });
  }

  async getStats(schoolId: string) {
    const [total, published, byType] = await Promise.all([
      prisma.learningResource.count({ where: { schoolId } }),
      prisma.learningResource.count({ where: { schoolId, isPublished: true } }),
      prisma.learningResource.groupBy({ by: ['resourceType'], where: { schoolId }, _count: true }),
    ]);
    return { total, published, byType };
  }
}

export const learningResourceService = new LearningResourceService();
