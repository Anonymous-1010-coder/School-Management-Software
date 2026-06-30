import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export class LibraryService {
  async findAll(schoolId: string, query: { search?: string; category?: string; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const where: any = { schoolId };
    if (query.search) { where.OR = [{ title: { contains: query.search, mode: 'insensitive' } }, { author: { contains: query.search, mode: 'insensitive' } }, { isbn: { contains: query.search } }]; }
    if (query.category) where.category = query.category;
    const [books, total] = await Promise.all([
      prisma.book.findMany({ where, skip: (page - 1) * limit, take: limit, include: { _count: { select: { borrows: true } } }, orderBy: { createdAt: 'desc' } }),
      prisma.book.count({ where }),
    ]);
    return { books, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(data: any) { return prisma.book.create({ data: { ...data, available: data.quantity } }); }

  async update(id: string, data: any) {
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) throw new NotFoundError('Book not found');
    return prisma.book.update({ where: { id }, data });
  }

  async delete(id: string) { await prisma.book.delete({ where: { id } }); return { success: true }; }

  async borrow(bookId: string, studentId: string, dueDate: string) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) throw new NotFoundError('Book not found');
    if (book.available < 1) throw new Error('No copies available');
    await prisma.book.update({ where: { id: bookId }, data: { available: book.available - 1 } });
    return prisma.bookBorrow.create({ data: { bookId, studentId, dueDate: new Date(dueDate) } });
  }

  async return(borrowId: string) {
    const borrow = await prisma.bookBorrow.findUnique({ where: { id: borrowId } });
    if (!borrow) throw new NotFoundError('Borrow record not found');
    await prisma.book.update({ where: { id: borrow.bookId }, data: { available: { increment: 1 } } });
    return prisma.bookBorrow.update({ where: { id: borrowId }, data: { returnDate: new Date(), isReturned: true } });
  }

  async getStats(schoolId: string) {
    const [total, available, borrowed] = await Promise.all([
      prisma.book.count({ where: { schoolId } }),
      prisma.book.aggregate({ where: { schoolId }, _sum: { available: true } }),
      prisma.bookBorrow.count({ where: { book: { schoolId }, isReturned: false } }),
    ]);
    return { total, available: available._sum.available || 0, borrowed };
  }
}
export const libraryService = new LibraryService();

export class HostelService {
  async findAll(schoolId: string) { return prisma.hostel.findMany({ where: { schoolId }, include: { rooms: { include: { _count: { select: { allocations: true } } } }, _count: { select: { allocations: true } } } }); }

  async create(data: any) { return prisma.hostel.create({ data, include: { rooms: true } }); }

  async addRoom(data: { hostelId: string; roomNo: string; capacity: number; bedCount: number; price: number }) {
    return prisma.hostelRoom.create({ data });
  }

  async allocate(data: { studentId: string; hostelId: string; roomId: string; bedNo: string; startDate?: string }) {
    return prisma.hostelAllocation.create({ data: { ...data, startDate: data.startDate ? new Date(data.startDate) : new Date() } });
  }

  async deallocate(id: string) {
    return prisma.hostelAllocation.update({ where: { id }, data: { endDate: new Date(), isActive: false } });
  }

  async getStats(schoolId: string) {
    const [total, allocated] = await Promise.all([
      prisma.hostel.aggregate({ where: { schoolId }, _sum: { capacity: true } }),
      prisma.hostelAllocation.count({ where: { hostel: { schoolId }, isActive: true } }),
    ]);
    return { totalCapacity: total._sum.capacity || 0, allocated, available: (total._sum.capacity || 0) - allocated };
  }
}
export const hostelService = new HostelService();

export class TransportService {
  async findAll(schoolId: string) { return prisma.vehicle.findMany({ where: { schoolId }, include: { _count: { select: { allocations: true } } } }); }

  async create(data: any) { return prisma.vehicle.create({ data }); }

  async allocate(data: { studentId: string; vehicleId: string; pickupPoint?: string; dropoffPoint?: string; fee: number }) {
    return prisma.transportAllocation.create({ data, include: { student: { include: { user: { select: { firstName: true, lastName: true } } } }, vehicle: true } });
  }

  async deallocate(id: string) { return prisma.transportAllocation.update({ where: { id }, data: { isActive: false } }); }
}
export const transportService = new TransportService();

export class ClinicService {
  async findAll(schoolId: string) { return prisma.medicalRecord.findMany({ where: { student: { user: { schoolId } } }, include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } }, orderBy: { date: 'desc' } }); }

  async create(data: { studentId: string; diagnosis: string; treatment?: string; medication?: string; notes?: string; treatedBy: string }) {
    return prisma.medicalRecord.create({ data, include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } } });
  }

  async getStats(schoolId: string) {
    const [total, today] = await Promise.all([
      prisma.medicalRecord.count({ where: { student: { user: { schoolId } } } }),
      prisma.medicalRecord.count({ where: { student: { user: { schoolId } }, date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    ]);
    return { total, today };
  }
}
export const clinicService = new ClinicService();

export class InventoryService {
  async findAll(schoolId: string) { return prisma.inventory.findMany({ where: { schoolId }, include: { supplier: true }, orderBy: { name: 'asc' } }); }

  async create(data: any) { return prisma.inventory.create({ data, include: { supplier: true } }); }

  async update(id: string, data: any) {
    const item = await prisma.inventory.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Item not found');
    return prisma.inventory.update({ where: { id }, data, include: { supplier: true } });
  }

  async delete(id: string) { await prisma.inventory.delete({ where: { id } }); return { success: true }; }

  async getStats(schoolId: string) {
    const items = await prisma.inventory.findMany({ where: { schoolId } });
    return { total: items.length, inStock: items.filter(i => i.quantity > i.minStock).length, lowStock: items.filter(i => i.quantity > 0 && i.quantity <= i.minStock).length, outOfStock: items.filter(i => i.quantity === 0).length };
  }
}
export const inventoryService = new InventoryService();

export class CommunicationService {
  async send(data: { senderId: string; receiverId: string; subject: string; body: string }) {
    return prisma.message.create({ data, include: { sender: { select: { firstName: true, lastName: true } }, receiver: { select: { firstName: true, lastName: true } } } });
  }

  async getInbox(userId: string) { return prisma.message.findMany({ where: { receiverId: userId }, include: { sender: { select: { firstName: true, lastName: true, avatar: true } } }, orderBy: { createdAt: 'desc' } }); }

  async getSent(userId: string) { return prisma.message.findMany({ where: { senderId: userId }, include: { receiver: { select: { firstName: true, lastName: true, avatar: true } } }, orderBy: { createdAt: 'desc' } }); }

  async markRead(id: string) { return prisma.message.update({ where: { id }, data: { isRead: true, readAt: new Date() } }); }

  async getNotifications(userId: string) { return prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 }); }

  async createNotification(data: { userId: string; title: string; message: string; type?: string; link?: string }) {
    return prisma.notification.create({ data: { ...data, type: data.type || 'INFO' } });
  }

  async markNotificationRead(id: string) { return prisma.notification.update({ where: { id }, data: { isRead: true } }); }
}
export const communicationService = new CommunicationService();

export class ParentService {
  async findAll(schoolId: string) {
    return prisma.parentProfile.findMany({
      where: { user: { schoolId } },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true } }, students: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
  }

  async findById(id: string) {
    const parent = await prisma.parentProfile.findUnique({ where: { id }, include: { user: true, students: { include: { user: { select: { firstName: true, lastName: true } }, currentClass: true } } } });
    if (!parent) throw new NotFoundError('Parent not found');
    return parent;
  }

  async create(data: any) {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(data.password, 12);
    return prisma.user.create({
      data: {
        email: data.email, password: hashedPassword, firstName: data.firstName, lastName: data.lastName,
        phone: data.phone, role: 'PARENT', schoolId: data.schoolId, isVerified: true,
        parentProfile: { create: { occupation: data.occupation, relationship: data.relationship } },
      },
      include: { parentProfile: true },
    });
  }

  async linkStudent(parentId: string, studentId: string) {
    return prisma.studentProfile.update({ where: { id: studentId }, data: { guardianId: parentId } });
  }
}
export const parentService = new ParentService();

export class DashboardService {
  async getStats(schoolId: string) {
    const [students, staff, classes, attendance, finance, exams] = await Promise.all([
      prisma.studentProfile.count({ where: { user: { schoolId } } }),
      prisma.user.count({ where: { schoolId, role: { not: 'STUDENT' as any }, isActive: true } }),
      prisma.class.count({ where: { schoolId } }),
      prisma.attendance.findMany({ where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      prisma.feePayment.aggregate({ where: { feeStructure: { schoolId } }, _sum: { paidAmount: true } }),
      prisma.exam.count({ where: { subject: { class: { schoolId } }, isActive: true } }),
    ]);
    const present = attendance.filter(a => a.status === 'PRESENT').length;
    return { students, staff, classes, attendanceRate: attendance.length ? ((present / attendance.length) * 100).toFixed(1) : '0', revenue: finance._sum.paidAmount || 0, activeExams: exams };
  }
}
export const dashboardService = new DashboardService();
