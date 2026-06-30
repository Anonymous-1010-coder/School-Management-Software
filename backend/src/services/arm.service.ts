import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export class ArmService {
  async findAll(schoolId: string, classId?: string) {
    const where: any = { class: { schoolId } };
    if (classId) where.classId = classId;
    return prisma.arm.findMany({
      where,
      include: {
        class: { select: { id: true, name: true } },
        classTeacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const arm = await prisma.arm.findUnique({
      where: { id },
      include: {
        class: true,
        classTeacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        _count: { select: { students: true } },
        students: { include: { user: { select: { firstName: true, lastName: true, avatar: true } } } },
      },
    });
    if (!arm) throw new NotFoundError('Arm not found');
    return arm;
  }

  async create(data: { name: string; code: string; classId: string }) {
    return prisma.arm.create({
      data,
      include: { class: { select: { id: true, name: true } }, _count: { select: { students: true } } },
    });
  }

  async update(id: string, data: { name?: string; code?: string; classTeacherId?: string }) {
    const arm = await prisma.arm.findUnique({ where: { id } });
    if (!arm) throw new NotFoundError('Arm not found');
    return prisma.arm.update({ where: { id }, data, include: { class: true } });
  }

  async delete(id: string) {
    const arm = await prisma.arm.findUnique({ where: { id } });
    if (!arm) throw new NotFoundError('Arm not found');
    await prisma.arm.delete({ where: { id } });
    return { success: true };
  }
}

export const armService = new ArmService();
