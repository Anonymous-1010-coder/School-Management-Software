import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export class ClassService {
  async findAll(schoolId: string) {
    return prisma.class.findMany({
      where: { schoolId },
      include: {
        arms: { include: { _count: { select: { students: true } }, classTeacher: { include: { user: { select: { firstName: true, lastName: true } } } } } },
        subjects: true,
        _count: { select: { currentStudents: true } },
      },
      orderBy: { academicLevel: 'asc' },
    });
  }

  async findById(id: string) {
    const cls = await prisma.class.findUnique({
      where: { id },
      include: {
        arms: { include: { _count: { select: { students: true } }, classTeacher: { include: { user: { select: { firstName: true, lastName: true } } } } } },
        subjects: { include: { teacher: { include: { user: { select: { firstName: true, lastName: true } } } } } },
        _count: { select: { currentStudents: true } },
      },
    });
    if (!cls) throw new NotFoundError('Class not found');
    return cls;
  }

  async create(data: { name: string; code: string; description?: string; academicLevel: number; schoolId: string }) {
    return prisma.class.create({
      data: { name: data.name, code: data.code, description: data.description, academicLevel: data.academicLevel, schoolId: data.schoolId },
      include: { arms: true, subjects: true, _count: { select: { currentStudents: true } } },
    });
  }

  async update(id: string, data: any) {
    const cls = await prisma.class.findUnique({ where: { id } });
    if (!cls) throw new NotFoundError('Class not found');
    return prisma.class.update({ where: { id }, data, include: { arms: true, subjects: true, _count: { select: { currentStudents: true } } } });
  }

  async delete(id: string) {
    const cls = await prisma.class.findUnique({ where: { id } });
    if (!cls) throw new NotFoundError('Class not found');
    await prisma.class.delete({ where: { id } });
    return { success: true };
  }

  async getStats(schoolId: string) {
    const [total, classes] = await Promise.all([
      prisma.class.count({ where: { schoolId } }),
      prisma.class.findMany({ where: { schoolId }, include: { _count: { select: { currentStudents: true, arms: true, subjects: true } } } }),
    ]);
    return { total, classes, totalStudents: classes.reduce((a, c) => a + c._count.currentStudents, 0) };
  }
}

export const classService = new ClassService();
