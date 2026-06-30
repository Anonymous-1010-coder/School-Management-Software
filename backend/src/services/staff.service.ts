import prisma from '../utils/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';

export class StaffService {
  async findAll(schoolId: string, query: { page?: number; limit?: number; search?: string; role?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const where: any = { schoolId, role: { not: 'STUDENT' as any } };
    if (query.role) where.role = query.role;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip: (page - 1) * limit, take: limit,
        include: { staffProfile: true, _count: { select: { activityLogs: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);
    return { staff: users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const staff = await prisma.user.findUnique({ where: { id }, include: { staffProfile: { include: { subjects: true, classTeacher: true } } } });
    if (!staff) throw new NotFoundError('Staff not found');
    return staff;
  }

  async create(data: any) {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const staffNumber = `STF${String(Date.now()).slice(-6)}`;
    return prisma.user.create({
      data: {
        email: data.email, password: hashedPassword, firstName: data.firstName, lastName: data.lastName,
        phone: data.phone, gender: data.gender, dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        address: data.address, role: data.role, schoolId: data.schoolId, isVerified: true,
        staffProfile: {
          create: { staffNumber, department: data.department, qualification: data.qualification, specialization: data.specialization, employmentType: data.employmentType || 'FULL_TIME', basicSalary: data.basicSalary ? Number(data.basicSalary) : undefined },
        },
      },
      include: { staffProfile: true },
    });
  }

  async update(id: string, data: any) {
    const user = await prisma.user.findUnique({ where: { id }, include: { staffProfile: true } });
    if (!user) throw new NotFoundError('Staff not found');
    const userData: any = {};
    if (data.firstName) userData.firstName = data.firstName;
    if (data.lastName) userData.lastName = data.lastName;
    if (data.phone) userData.phone = data.phone;
    if (data.address) userData.address = data.address;
    if (data.role) userData.role = data.role;
    if (Object.keys(userData).length > 0) await prisma.user.update({ where: { id }, data: userData });
    if (data.staffProfile && user.staffProfile) {
      const profileData: any = {};
      if (data.staffProfile.department) profileData.department = data.staffProfile.department;
      if (data.staffProfile.qualification) profileData.qualification = data.staffProfile.qualification;
      if (data.staffProfile.specialization) profileData.specialization = data.staffProfile.specialization;
      if (data.staffProfile.employmentType) profileData.employmentType = data.staffProfile.employmentType;
      if (data.staffProfile.basicSalary) profileData.basicSalary = Number(data.staffProfile.basicSalary);
      if (Object.keys(profileData).length > 0) await prisma.staffProfile.update({ where: { id: user.staffProfile.id }, data: profileData });
    }
    return this.findById(id);
  }

  async delete(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('Staff not found');
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return { success: true };
  }
}
export const staffService = new StaffService();
