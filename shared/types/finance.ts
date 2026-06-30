export interface FeeStructure {
  id: string;
  name: string;
  classId: string;
  amount: number;
  term: string;
  session: string;
  dueDate: string;
  category: 'TUITION' | 'BOARDING' | 'TRANSPORT' | 'LIBRARY' | 'SPORTS' | 'LABORATORY' | 'OTHER';
  isCompulsory: boolean;
}

export interface Payment {
  id: string;
  studentId: string;
  feeStructureId: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERPAID' | 'REFUNDED';
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'ONLINE' | 'CHEQUE';
  transactionRef?: string;
  paidAt: string;
  receiptNo?: string;
}

export interface Expense {
  id: string;
  title: string;
  description?: string;
  amount: number;
  category: 'SALARY' | 'UTILITIES' | 'MAINTENANCE' | 'SUPPLIES' | 'TRANSPORT' | 'OTHER';
  paymentMethod: string;
  paidTo?: string;
  receipt?: string;
  approvedBy: string;
  date: string;
}

export interface Payroll {
  id: string;
  staffId: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  month: number;
  year: number;
  status: 'PENDING' | 'PAID';
  paidAt?: string;
}

export interface Invoice {
  id: string;
  studentId: string;
  invoiceNo: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'DRAFT' | 'SENT' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: string;
  issuedAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}
