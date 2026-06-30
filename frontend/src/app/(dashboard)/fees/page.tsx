'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Receipt, Search, Plus, DollarSign, CreditCard, Loader2, AlertCircle, Landmark } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { financeApi, studentApi } from '@/lib/endpoints';

const statusColors: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  PAID: 'success',
  PARTIAL: 'warning',
  OVERDUE: 'destructive',
  PENDING: 'secondary',
};

export default function FeesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ studentId: '', feeStructureId: '', amount: '', paymentMethod: '' });

  const { data: feeStructuresData, isLoading: fsLoading } = useQuery({
    queryKey: ['fee-structures'],
    queryFn: () => financeApi.getFeeStructures().then(r => r.data.data),
  });

  const { data: paymentsData, isLoading: pLoading, isError, refetch } = useQuery({
    queryKey: ['payments'],
    queryFn: () => financeApi.getPayments().then(r => r.data.data),
  });

  const { data: studentsData } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentApi.getAll().then(r => r.data.data),
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data: any) => financeApi.recordPayment(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payments'] }); queryClient.invalidateQueries({ queryKey: ['finance-stats'] }); toast({ title: 'Payment recorded', variant: 'success' }); setShowPayment(false); setPaymentForm({ studentId: '', feeStructureId: '', amount: '', paymentMethod: '' }); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to record payment', variant: 'destructive' }),
  });

  const feeStructures = Array.isArray(feeStructuresData) ? feeStructuresData : feeStructuresData?.feeStructures || [];
  const payments = Array.isArray(paymentsData) ? paymentsData : paymentsData?.payments || [];
  const students = Array.isArray(studentsData) ? studentsData : studentsData?.students || [];

  const totalCollected = payments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const totalExpected = feeStructures.reduce((s: number, f: any) => s + (f.amount || 0), 0);
  const pendingAmount = totalExpected - totalCollected;

  const filtered = payments.filter((p: any) =>
    !search || p.student?.firstName?.toLowerCase().includes(search.toLowerCase()) || p.student?.lastName?.toLowerCase().includes(search.toLowerCase()) || p.feeStructure?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleRecordPayment = () => {
    if (!paymentForm.studentId || !paymentForm.feeStructureId || !paymentForm.amount) { toast({ title: 'All fields are required', variant: 'destructive' }); return; }
    recordPaymentMutation.mutate({ ...paymentForm, amount: parseFloat(paymentForm.amount) });
  };

  const isLoading = fsLoading || pLoading;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="/finance">Finance</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Fees</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Fees Management</h1><p className="text-muted-foreground">Manage fee structures, payments, and receipts</p></div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><CreditCard className="h-4 w-4" /> Create Fee</Button>
          <Button className="gap-2" onClick={() => setShowPayment(true)}><Plus className="h-4 w-4" /> Record Payment</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4 text-center"><DollarSign className="h-5 w-5 mx-auto mb-1 text-blue-600" /><p className="text-2xl font-bold">₦{(totalCollected / 1000000).toFixed(1)}M</p><p className="text-xs text-muted-foreground">Total Collected</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Landmark className="h-5 w-5 mx-auto mb-1 text-orange-600" /><p className="text-2xl font-bold">₦{(Math.max(pendingAmount, 0) / 1000000).toFixed(1)}M</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Receipt className="h-5 w-5 mx-auto mb-1 text-green-600" /><p className="text-2xl font-bold">{feeStructures.length}</p><p className="text-xs text-muted-foreground">Fee Structures</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Badge variant="success" className="mx-auto mb-1">%</Badge><p className="text-2xl font-bold">{totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0}%</p><p className="text-xs text-muted-foreground">Collection Rate</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payment Records</CardTitle>
          <div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search payments..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-8"><AlertCircle className="h-8 w-8 text-destructive" /><p className="text-muted-foreground">Failed to load payments</p><Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button></div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center gap-3 py-8"><Receipt className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No payment records found</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Fee Structure</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p: any) => {
                  const amount = p.amount || 0;
                  const feeAmount = p.feeStructure?.amount || 0;
                  const balance = Math.max(feeAmount - (p.totalPaid || amount), 0);
                  const status = balance <= 0 ? 'PAID' : amount > 0 ? 'PARTIAL' : 'PENDING';
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.student ? `${p.student.firstName} ${p.student.lastName}` : '-'}</TableCell>
                      <TableCell>{p.feeStructure?.name || p.description || '-'}</TableCell>
                      <TableCell className="text-green-600 font-medium">₦{amount.toLocaleString()}</TableCell>
                      <TableCell className={balance > 0 ? 'text-red-600 font-medium' : ''}>₦{balance.toLocaleString()}</TableCell>
                      <TableCell><Badge variant={statusColors[status] || 'secondary'}>{status}</Badge></TableCell>
                      <TableCell>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</TableCell>
                      <TableCell><Button variant="ghost" size="icon"><Receipt className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Record a new fee payment</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Student *</Label>
              <Select value={paymentForm.studentId} onValueChange={v => setPaymentForm({ ...paymentForm, studentId: v })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Fee Structure *</Label>
              <Select value={paymentForm.feeStructureId} onValueChange={v => setPaymentForm({ ...paymentForm, feeStructureId: v })}>
                <SelectTrigger><SelectValue placeholder="Select fee structure" /></SelectTrigger>
                <SelectContent>
                  {feeStructures.map((f: any) => <SelectItem key={f.id} value={f.id}>{f.name} - ₦{(f.amount || 0).toLocaleString()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Amount *</Label><Input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="50000" /></div>
            <div className="space-y-2"><Label>Payment Method</Label><Input value={paymentForm.paymentMethod} onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })} placeholder="Transfer / Cash" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPayment(false); setPaymentForm({ studentId: '', feeStructureId: '', amount: '', paymentMethod: '' }); }}>Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={recordPaymentMutation.isPending}>{recordPaymentMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
