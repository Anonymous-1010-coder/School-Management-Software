'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Stethoscope, Search, Plus, Loader2, AlertCircle, Activity, CalendarDays, Check, ChevronsUpDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { clinicApi, studentApi } from '@/lib/endpoints';

export default function ClinicPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const [form, setForm] = useState({ studentId: '', diagnosis: '', treatment: '', treatedBy: '', followUp: '' });
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: recordsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['clinic-records'],
    queryFn: () => clinicApi.getAll().then(r => r.data.data),
  });

  const { data: statsData } = useQuery({
    queryKey: ['clinic-stats'],
    queryFn: () => clinicApi.getStats().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => clinicApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clinic-records'] }); queryClient.invalidateQueries({ queryKey: ['clinic-stats'] }); toast({ title: 'Record created', variant: 'success' }); setShowAdd(false); setForm({ studentId: '', diagnosis: '', treatment: '', treatedBy: '', followUp: '' }); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create record', variant: 'destructive' }),
  });

  const { data: studentsData } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentApi.getAll().then(r => r.data.data),
  });
  const students = Array.isArray(studentsData) ? studentsData : studentsData?.students || [];

  const selectedStudent = students.find((s: any) => s.id === form.studentId);

  const records = Array.isArray(recordsData) ? recordsData : recordsData?.records || [];
  const stats = statsData || {};
  const totalRecords = stats?.totalRecords ?? stats?.total ?? records.length;
  const todayRecords = stats?.todayRecords ?? stats?.today ?? 0;

  const filtered = records.filter((r: any) =>
    !search || r.student?.firstName?.toLowerCase().includes(search.toLowerCase()) || r.student?.lastName?.toLowerCase().includes(search.toLowerCase()) || r.diagnosis?.toLowerCase().includes(search.toLowerCase()) || r.student?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Clinic</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Clinic Records</h1><p className="text-muted-foreground">Medical records, diagnosis, and treatments</p></div>
        <Button className="gap-2" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> Add Record</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardContent className="p-4 text-center"><Activity className="h-5 w-5 mx-auto mb-1 text-blue-600" /><p className="text-2xl font-bold">{totalRecords}</p><p className="text-xs text-muted-foreground">Total Records</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><CalendarDays className="h-5 w-5 mx-auto mb-1 text-green-600" /><p className="text-2xl font-bold">{todayRecords}</p><p className="text-xs text-muted-foreground">Today&apos;s Records</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Medical Records</CardTitle>
          <div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search student or diagnosis..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-8"><AlertCircle className="h-8 w-8 text-destructive" /><p className="text-muted-foreground">Failed to load records</p><Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button></div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center gap-3 py-8"><Stethoscope className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No records found</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Treated By</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r: any, i: number) => (
                  <TableRow key={r.id || i}>
                    <TableCell>{r.date ? new Date(r.date).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className="font-medium">{r.student?.firstName ? `${r.student.firstName} ${r.student.lastName}` : r.student?.name || '-'}</TableCell>
                    <TableCell><Badge variant="outline">{r.diagnosis}</Badge></TableCell>
                    <TableCell>{r.treatment}</TableCell>
                    <TableCell>{r.treatedBy || r.treated_by || '-'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon"><Stethoscope className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Medical Record</DialogTitle>
            <DialogDescription>Enter patient diagnosis and treatment details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>Student *</Label>
              <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={studentSearchOpen} className="w-full justify-between">
                    {selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : 'Select student...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search students..." />
                    <CommandEmpty>No student found.</CommandEmpty>
                    <CommandGroup className="max-h-48 overflow-y-auto">
                      {students.map((s: any) => (
                        <CommandItem key={s.id} value={s.id} onSelect={() => { setForm({ ...form, studentId: s.id }); setStudentSearchOpen(false); }}>
                          <Check className={cn('mr-2 h-4 w-4', form.studentId === s.id ? 'opacity-100' : 'opacity-0')} />
                          {s.firstName} {s.lastName} {s.admissionNumber ? `(${s.admissionNumber})` : ''}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2"><Label>Diagnosis</Label><Input value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} placeholder="e.g., Malaria" /></div>
            <div className="space-y-2"><Label>Treatment</Label><Input value={form.treatment} onChange={e => setForm({ ...form, treatment: e.target.value })} placeholder="e.g., ACT 80/480" /></div>
            <div className="space-y-2"><Label>Treated By</Label><Input value={form.treatedBy} onChange={e => setForm({ ...form, treatedBy: e.target.value })} placeholder="e.g., Nurse Davis" /></div>
            <div className="space-y-2"><Label>Follow-up Date</Label><Input type="date" value={form.followUp} onChange={e => setForm({ ...form, followUp: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setForm({ studentId: '', diagnosis: '', treatment: '', treatedBy: '', followUp: '' }); }}>Cancel</Button>
            <Button onClick={() => createMutation.mutate({ ...form, date })} disabled={createMutation.isPending || !form.diagnosis}>
              {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
