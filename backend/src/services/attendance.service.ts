import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export class AttendanceService {
  async findAll(schoolId: string, query: { date?: string; classId?: string; armId?: string; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: any = {};
    if (query.classId) where.classId = query.classId;
    if (query.armId) where.armId = query.armId;
    if (query.date) where.date = new Date(query.date);
    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where, skip: (page - 1) * limit, take: limit,
        include: { student: { include: { user: { select: { firstName: true, lastName: true } } } }, staff: { include: { user: { select: { firstName: true, lastName: true } } } } },
        orderBy: { date: 'desc' },
      }),
      prisma.attendance.count({ where }),
    ]);
    return { records, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async mark(data: { studentId?: string; staffId?: string; date: string; status: string; classId?: string; armId?: string; markedBy: string; remark?: string }) {
    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);
    if (data.studentId) {
      const existing = await prisma.attendance.findUnique({ where: { studentId_date: { studentId: data.studentId, date } } });
      if (existing) return prisma.attendance.update({ where: { id: existing.id }, data: { status: data.status as any, remark: data.remark } });
    }
    return prisma.attendance.create({ data: { ...data, date, status: data.status as any } as any });
  }

  async markBulk(records: { studentId?: string; status: string; date: string; classId?: string; armId?: string }[], markedBy: string) {
    const results = [];
    for (const record of records) {
      results.push(await this.mark({ ...record, markedBy }));
    }
    return results;
  }

  async getStats(schoolId: string, date?: string) {
    const today = date ? new Date(date) : new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const records = await prisma.attendance.findMany({ where: { date: { gte: today, lt: tomorrow } } });
    const present = records.filter(r => r.status === 'PRESENT').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const late = records.filter(r => r.status === 'LATE').length;
    const excused = records.filter(r => r.status === 'EXCUSED').length;
    return { total: records.length, present, absent, late, excused, rate: records.length ? ((present + late) / records.length * 100).toFixed(1) : '0' };
  }
}
export const attendanceService = new AttendanceService();
