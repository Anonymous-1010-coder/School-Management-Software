import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export class FinanceService {
  async getFeeStructures(schoolId: string, classId?: string) {
    const where: any = { schoolId };
    if (classId) where.classId = classId;
    return prisma.feeStructure.findMany({ where, include: { class: { select: { id: true, name: true } }, _count: { select: { payments: true } } }, orderBy: { createdAt: 'desc' } });
  }

  async createFeeStructure(data: { name: string; classId: string; amount: number; term: string; session: string; dueDate: string; category?: string; isCompulsory?: boolean; schoolId: string }) {
    return prisma.feeStructure.create({ data: { ...data, dueDate: new Date(data.dueDate), category: data.category as any || 'TUITION', isCompulsory: data.isCompulsory ?? true } as any, include: { class: true } });
  }

  async updateFeeStructure(id: string, data: any) {
    const fee = await prisma.feeStructure.findUnique({ where: { id } });
    if (!fee) throw new NotFoundError('Fee structure not found');
    if (data.dueDate) data.dueDate = new Date(data.dueDate);
    return prisma.feeStructure.update({ where: { id }, data });
  }

  async deleteFeeStructure(id: string) {
    await prisma.feeStructure.delete({ where: { id } });
    return { success: true };
  }

  async getPayments(schoolId: string, query: { classId?: string; studentId?: string; status?: string }) {
    const where: any = { feeStructure: { schoolId } };
    if (query.classId) where.feeStructure = { ...where.feeStructure, classId: query.classId };
    if (query.studentId) where.studentId = query.studentId;
    if (query.status) where.status = query.status;
    return prisma.feePayment.findMany({ where, include: { student: { include: { user: { select: { firstName: true, lastName: true } } } }, feeStructure: { include: { class: true } } }, orderBy: { createdAt: 'desc' } });
  }

  async recordPayment(data: { studentId: string; feeStructureId: string; amount: number; paidAmount: number; paymentMethod: string; transactionRef?: string; receiptNo?: string }) {
    const balance = data.amount - data.paidAmount;
    const status = balance <= 0 ? 'PAID' : balance < data.amount ? 'PARTIAL' : 'PENDING';
    return prisma.feePayment.create({ data: { ...data, balance, status: status as any, paidAt: new Date() } as any, include: { student: { include: { user: { select: { firstName: true, lastName: true } } } }, feeStructure: true } });
  }

  async getExpenses(schoolId: string) {
    return prisma.expense.findMany({ where: { schoolId }, orderBy: { date: 'desc' } });
  }

  async createExpense(data: { title: string; description?: string; amount: number; category: string; paymentMethod: string; paidTo?: string; approvedBy: string; schoolId: string }) {
    return prisma.expense.create({ data: { ...data, category: data.category as any } as any });
  }

  async getPayrolls(schoolId: string, month?: number, year?: number) {
    const where: any = { schoolId };
    if (month) where.month = month;
    if (year) where.year = year;
    return prisma.payroll.findMany({ where, include: { staff: { include: { user: { select: { firstName: true, lastName: true } } } }, user: { select: { firstName: true, lastName: true } } }, orderBy: [{ year: 'desc' }, { month: 'desc' }] });
  }

  async runPayroll(data: { staffId: string; userId: string; basicSalary: number; allowances?: number; deductions?: number; month: number; year: number; schoolId: string }) {
    const netSalary = (data.basicSalary + (data.allowances || 0)) - (data.deductions || 0);
    return prisma.payroll.upsert({
      where: { staffId_month_year: { staffId: data.staffId, month: data.month, year: data.year } },
      create: { ...data, netSalary, allowances: data.allowances || 0, deductions: data.deductions || 0 },
      update: { basicSalary: data.basicSalary, allowances: data.allowances || 0, deductions: data.deductions || 0, netSalary },
      include: { staff: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
  }

  async getStats(schoolId: string) {
    const [totalFees, totalPayments, totalExpenses, totalPayroll] = await Promise.all([
      prisma.feePayment.aggregate({ where: { feeStructure: { schoolId } }, _sum: { paidAmount: true } }),
      prisma.feePayment.count({ where: { feeStructure: { schoolId } } }),
      prisma.expense.aggregate({ where: { schoolId }, _sum: { amount: true } }),
      prisma.payroll.aggregate({ where: { schoolId, status: 'PAID' }, _sum: { netSalary: true } }),
    ]);
    return { totalRevenue: totalFees._sum.paidAmount || 0, totalPayments, totalExpenses: totalExpenses._sum.amount || 0, totalPayroll: totalPayroll._sum.netSalary || 0 };
  }
}
export const financeService = new FinanceService();
