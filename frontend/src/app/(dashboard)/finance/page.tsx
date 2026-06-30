'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Search, Plus, TrendingUp, TrendingDown, DollarSign, Receipt, Loader2, AlertCircle, Landmark } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { financeApi } from '@/lib/endpoints';

export default function FinancePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('transactions');
  const [showExpense, setShowExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', category: '', paymentMethod: '' });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['finance-stats'],
    queryFn: () => financeApi.getStats().then(r => r.data.data),
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['payments'],
    queryFn: () => financeApi.getPayments().then(r => r.data.data),
  });

  const { data: expensesData } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => financeApi.getExpenses().then(r => r.data.data),
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data: any) => financeApi.createExpense(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); queryClient.invalidateQueries({ queryKey: ['finance-stats'] }); toast({ title: 'Expense added', variant: 'success' }); setShowExpense(false); setExpenseForm({ description: '', amount: '', category: '', paymentMethod: '' }); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to add expense', variant: 'destructive' }),
  });

  const stats = statsData || {};
  const payments = Array.isArray(paymentsData) ? paymentsData : paymentsData?.payments || [];
  const expenses = Array.isArray(expensesData) ? expensesData : expensesData?.expenses || [];

  const totalIncome = stats.totalRevenue ?? stats.totalIncome ?? payments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const totalExpenses = stats.totalExpenses ?? expenses.reduce((s: number, e: any) => s + (e.amount || 0), 0);
  const totalPayroll = stats.totalPayroll ?? 0;
  const netBalance = (totalIncome || 0) - (totalExpenses || 0) - (totalPayroll || 0);

  const allTransactions = [
    ...payments.map((p: any) => ({ ...p, type: 'Income', date: p.paymentDate || p.createdAt })),
    ...expenses.map((e: any) => ({ ...e, type: 'Expense', date: e.expenseDate || e.createdAt })),
  ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filtered = allTransactions.filter((t: any) =>
    !search || t.description?.toLowerCase().includes(search.toLowerCase()) || t.student?.firstName?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredByTab = tab === 'income' ? filtered.filter((t: any) => t.type === 'Income') : tab === 'expenses' ? filtered.filter((t: any) => t.type === 'Expense') : filtered;

  const handleAddExpense = () => {
    if (!expenseForm.description || !expenseForm.amount) { toast({ title: 'Description and amount are required', variant: 'destructive' }); return; }
    createExpenseMutation.mutate({ description: expenseForm.description, amount: parseFloat(expenseForm.amount), category: expenseForm.category, paymentMethod: expenseForm.paymentMethod });
  };

  const formatCurrency = (amount: number) => `₦${(amount / 1000000).toFixed(1)}M`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Finance</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Finance</h1><p className="text-muted-foreground">Financial management and accounting</p></div>
        <Button className="gap-2" onClick={() => setShowExpense(true)}><Plus className="h-4 w-4" /> Add Expense</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><DollarSign className="h-5 w-5 mb-1 text-blue-600" /><p className="text-2xl font-bold">{statsLoading ? '...' : formatCurrency(totalIncome)}</p><p className="text-xs text-muted-foreground">Total Revenue</p></CardContent></Card>
        <Card><CardContent className="p-4"><TrendingDown className="h-5 w-5 mb-1 text-red-600" /><p className="text-2xl font-bold">{statsLoading ? '...' : formatCurrency(totalExpenses)}</p><p className="text-xs text-muted-foreground">Expenses</p></CardContent></Card>
        <Card><CardContent className="p-4"><Receipt className="h-5 w-5 mb-1 text-purple-600" /><p className="text-2xl font-bold">{statsLoading ? '...' : formatCurrency(totalPayroll)}</p><p className="text-xs text-muted-foreground">Payroll</p></CardContent></Card>
        <Card><CardContent className="p-4"><TrendingUp className="h-5 w-5 mb-1 text-green-600" /><p className="text-2xl font-bold">{statsLoading ? '...' : formatCurrency(Math.max(netBalance, 0))}</p><p className="text-xs text-muted-foreground">Net Balance</p></CardContent></Card>
      </div>

      <Tabs defaultValue="transactions" onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{tab === 'income' ? 'Income' : tab === 'expenses' ? 'Expenses' : 'Recent Transactions'}</CardTitle>
              <div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
            </CardHeader>
            <CardContent>
              {!filteredByTab.length ? (
                <div className="flex flex-col items-center gap-3 py-8"><Landmark className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No transactions found</p></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredByTab.map((t: any, i: number) => (
                      <TableRow key={t.id || i}>
                        <TableCell className="font-medium">{t.description || t.feeStructure?.name || `Payment from ${t.student?.firstName} ${t.student?.lastName}`}</TableCell>
                        <TableCell><Badge variant={t.type === 'Income' ? 'success' : 'destructive'}>{t.type}</Badge></TableCell>
                        <TableCell className={t.type === 'Income' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>₦{(t.amount || 0).toLocaleString()}</TableCell>
                        <TableCell>{t.date ? new Date(t.date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{t.paymentMethod || t.method || '-'}</TableCell>
                        <TableCell><Badge variant={t.status === 'COMPLETED' || t.status === 'Completed' ? 'success' : 'warning'}>{t.status || 'Completed'}</Badge></TableCell>
                        <TableCell><Button variant="ghost" size="icon"><Search className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showExpense} onOpenChange={setShowExpense}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Record a new expense</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Description *</Label><Input value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="Office supplies" /></div>
            <div className="space-y-2"><Label>Amount *</Label><Input type="number" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="100000" /></div>
            <div className="space-y-2"><Label>Category</Label><Input value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })} placeholder="Utilities" /></div>
            <div className="space-y-2"><Label>Payment Method</Label><Input value={expenseForm.paymentMethod} onChange={e => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })} placeholder="Transfer / Cash" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowExpense(false); setExpenseForm({ description: '', amount: '', category: '', paymentMethod: '' }); }}>Cancel</Button>
            <Button onClick={handleAddExpense} disabled={createExpenseMutation.isPending}>{createExpenseMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
