import prisma from '../utils/prisma';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors';

export class StudentService {
  async findAll(schoolId: string, query: { page?: number; limit?: number; search?: string; classId?: string; armId?: string; status?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      user: { schoolId },
      ...(query.classId && { currentClassId: query.classId }),
      ...(query.armId && { currentArmId: query.armId }),
      ...(query.status && { enrollmentStatus: query.status }),
      ...(query.search && {
        OR: [
          { admissionNumber: { contains: query.search, mode: 'insensitive' } },
          { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
          { user: { lastName: { contains: query.search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [students, total] = await Promise.all([
      prisma.studentProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, gender: true, avatar: true, isActive: true } },
          currentClass: { select: { id: true, name: true, code: true } },
          currentArm: { select: { id: true, name: true } },
          guardian: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.studentProfile.count({ where }),
    ]);

    return { students, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const student = await prisma.studentProfile.findUnique({
      where: { id },
      include: {
        user: true,
        currentClass: true,
        currentArm: true,
        guardian: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } } },
        attendances: { take: 10, orderBy: { date: 'desc' } },
        results: { take: 10, orderBy: { examId: 'asc' }, include: { exam: true, subject: true } },
        feePayments: { take: 10, orderBy: { createdAt: 'desc' } },
        medicalRecords: { take: 5, orderBy: { date: 'desc' } },
      },
    });
    if (!student) throw new NotFoundError('Student not found');
    return student;
  }

  async create(data: {
    firstName: string; lastName: string; email: string; password: string;
    phone?: string; gender?: string; dateOfBirth?: string; address?: string;
    currentClassId?: string; currentArmId?: string; guardianId?: string;
    bloodGroup?: string; genotype?: string; medicalInfo?: string; religion?: string;
    nationality?: string; stateOfOrigin?: string; lga?: string; session?: string;
    schoolId: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictError('Email already registered');

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const admissionNumber = `STU${String(Date.now()).slice(-6)}`;

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        gender: data.gender as any,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        address: data.address,
        role: 'STUDENT',
        schoolId: data.schoolId,
        isVerified: true,
        studentProfile: {
          create: {
            admissionNumber,
            currentClassId: data.currentClassId,
            currentArmId: data.currentArmId,
            guardianId: data.guardianId,
            bloodGroup: data.bloodGroup,
            genotype: data.genotype,
            medicalInfo: data.medicalInfo,
            religion: data.religion,
            nationality: data.nationality || 'Nigerian',
            stateOfOrigin: data.stateOfOrigin,
            lga: data.lga,
            session: data.session,
          },
        },
      },
      include: {
        studentProfile: {
          include: {
            currentClass: true,
            currentArm: true,
            guardian: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
          },
        },
      },
    });

    return user;
  }

  async update(id: string, data: any) {
    const student = await prisma.studentProfile.findUnique({ where: { id } });
    if (!student) throw new NotFoundError('Student not found');

    const userData: any = {};
    if (data.firstName) userData.firstName = data.firstName;
    if (data.lastName) userData.lastName = data.lastName;
    if (data.phone) userData.phone = data.phone;
    if (data.gender) userData.gender = data.gender;
    if (data.dateOfBirth) userData.dateOfBirth = new Date(data.dateOfBirth);
    if (data.address) userData.address = data.address;

    if (Object.keys(userData).length > 0) {
      await prisma.user.update({ where: { id: student.userId }, data: userData });
    }

    const profileData: any = {};
    if (data.currentClassId !== undefined) profileData.currentClassId = data.currentClassId;
    if (data.currentArmId !== undefined) profileData.currentArmId = data.currentArmId;
    if (data.guardianId !== undefined) profileData.guardianId = data.guardianId;
    if (data.bloodGroup) profileData.bloodGroup = data.bloodGroup;
    if (data.genotype) profileData.genotype = data.genotype;
    if (data.medicalInfo) profileData.medicalInfo = data.medicalInfo;
    if (data.religion) profileData.religion = data.religion;
    if (data.nationality) profileData.nationality = data.nationality;
    if (data.stateOfOrigin) profileData.stateOfOrigin = data.stateOfOrigin;
    if (data.lga) profileData.lga = data.lga;
    if (data.session) profileData.session = data.session;
    if (data.enrollmentStatus) profileData.enrollmentStatus = data.enrollmentStatus;

    if (Object.keys(profileData).length > 0) {
      await prisma.studentProfile.update({ where: { id }, data: profileData });
    }

    return this.findById(id);
  }

  async delete(id: string) {
    const student = await prisma.studentProfile.findUnique({ where: { id } });
    if (!student) throw new NotFoundError('Student not found');
    await prisma.user.delete({ where: { id: student.userId } });
    return { success: true };
  }

  async promote(id: string, newClassId: string, newArmId?: string) {
    const student = await prisma.studentProfile.findUnique({ where: { id } });
    if (!student) throw new NotFoundError('Student not found');

    return prisma.studentProfile.update({
      where: { id },
      data: {
        currentClassId: newClassId,
        currentArmId: newArmId || null,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        currentClass: true,
        currentArm: true,
      },
    });
  }

  async getStats(schoolId: string) {
    const [total, active, byStatus, students] = await Promise.all([
      prisma.studentProfile.count({ where: { user: { schoolId } } }),
      prisma.studentProfile.count({ where: { user: { schoolId }, enrollmentStatus: 'ACTIVE' } }),
      prisma.studentProfile.groupBy({ by: ['enrollmentStatus'], where: { user: { schoolId } }, _count: true }),
      prisma.studentProfile.findMany({
        where: { user: { schoolId } },
        include: { user: { select: { gender: true } } },
      }),
    ]);

    const genderCounts = students.filter(s => s.enrollmentStatus === 'ACTIVE').reduce((acc: any, s: any) => {
      if (s.user.gender === 'MALE') acc.male++;
      else if (s.user.gender === 'FEMALE') acc.female++;
      return acc;
    }, { male: 0, female: 0 });

    return { total, active, byStatus, genderDistribution: genderCounts };
  }
}

export const studentService = new StudentService();
