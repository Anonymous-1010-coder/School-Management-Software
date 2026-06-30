'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus, Search, Plus, CheckCircle, XCircle, Clock, Loader2, AlertCircle,
  GraduationCap, Eye, FileText, Filter, CalendarDays, Phone, Mail, MapPin,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { studentApi, classApi } from '@/lib/endpoints';

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary'; icon: any }> = {
  PENDING: { label: 'Pending', variant: 'warning', icon: Clock },
  APPROVED: { label: 'Approved', variant: 'success', icon: CheckCircle },
  REJECTED: { label: 'Rejected', variant: 'destructive', icon: XCircle },
  ACTIVE: { label: 'Approved', variant: 'success', icon: CheckCircle },
};

export default function AdmissionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [showView, setShowView] = useState<any>(null);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '',
    gender: '', currentClassId: '', address: '', dateOfBirth: '',
  });

  const { data: studentsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['admissions', statusFilter, classFilter, page, search],
    queryFn: () => studentApi.getAll({
      page,
      search,
      limit: 10,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      classId: classFilter === 'ALL' ? undefined : classFilter,
    }).then(r => r.data),
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classApi.getAll().then(r => r.data.data || []),
  });

  const rawStudents = studentsData?.students || studentsData || [];
  const students = Array.isArray(rawStudents) ? rawStudents : [];
  const total = studentsData?.total ?? studentsData?.totalCount ?? students.length;
  const tp = studentsData?.totalPages ?? 1;
  if (tp !== totalPages) setTotalPages(tp);

  const classes = Array.isArray(classesData) ? classesData : [];
  const pending = students.filter((s: any) => {
    const st = s.status || s.enrollmentStatus || '';
    return st === 'PENDING';
  }).length;
  const approved = students.filter((s: any) => {
    const st = s.status || s.enrollmentStatus || '';
    return st === 'APPROVED' || st === 'ACTIVE';
  }).length;
  const rejected = students.filter((s: any) => {
    const st = s.status || s.enrollmentStatus || '';
    return st === 'REJECTED';
  }).length;

  const approveMutation = useMutation({
    mutationFn: (id: string) => studentApi.update(id, { status: 'APPROVED', enrollmentStatus: 'ACTIVE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      toast({ title: 'Admission approved', variant: 'success' as any });
    },
    onError: (err: any) => toast({
      title: 'Error', description: err.response?.data?.message || 'Failed to approve', variant: 'destructive' as any,
    }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => studentApi.update(id, { status: 'REJECTED', enrollmentStatus: 'REJECTED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      toast({ title: 'Admission rejected', variant: 'success' as any });
    },
    onError: (err: any) => toast({
      title: 'Error', description: err.response?.data?.message || 'Failed to reject', variant: 'destructive' as any,
    }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => studentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      toast({ title: 'Admission application submitted', variant: 'success' as any });
      setShowAdd(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', phone: '', gender: '', currentClassId: '', address: '', dateOfBirth: '' });
    },
    onError: (err: any) => toast({
      title: 'Error', description: err.response?.data?.message || 'Failed to submit admission', variant: 'destructive' as any,
    }),
  });

  const handleAdd = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.currentClassId) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' as any });
      return;
    }
    createMutation.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password || 'password123',
      phone: form.phone,
      gender: form.gender,
      currentClassId: form.currentClassId,
      address: form.address,
      dateOfBirth: form.dateOfBirth,
      enrollmentStatus: 'PENDING',
      status: 'PENDING',
    });
  };

  const getStudentName = (s: any) => {
    if (s.firstName) return `${s.firstName} ${s.lastName || ''}`;
    if (s.user?.firstName) return `${s.user.firstName} ${s.user.lastName || ''}`;
    return '-';
  };

  const getStudentStatus = (s: any) => s.status || s.enrollmentStatus || 'PENDING';
  const getAdmissionNo = (s: any) => s.admissionNo || s.admissionNumber || '-';
  const getClassName = (s: any) => s.class?.name || s.currentClass?.name || s.arm?.name || '-';
  const getEmail = (s: any) => s.email || s.user?.email || '-';
  const getPhone = (s: any) => s.phone || s.user?.phone || '-';
  const getGender = (s: any) => s.gender || s.user?.gender || '-';
  const getDate = (s: any) => {
    const d = s.createdAt || s.applicationDate;
    return d ? new Date(d).toLocaleDateString() : '-';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="/students">Students</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Admissions</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admissions</h1>
          <p className="text-muted-foreground">Process and manage student admissions</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" /> New Admission
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <GraduationCap className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">Total Applications</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-orange-600" />
            <p className="text-2xl font-bold text-orange-600">{pending}</p>
            <p className="text-xs text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-bold text-green-600">{approved}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="h-5 w-5 mx-auto mb-1 text-red-600" />
            <p className="text-2xl font-bold text-red-600">{rejected}</p>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle>Admission Applications</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name..." className="pl-8" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select value={classFilter} onValueChange={v => { setClassFilter(v); setPage(1); }}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Classes</SelectItem>
                {classes.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-muted-foreground">Failed to load admissions</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No admissions found</p>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4" /> Add New Admission
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Admission No.</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Application Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s: any) => {
                      const st = getStudentStatus(s);
                      const cfg = statusConfig[st] || statusConfig.PENDING;
                      const StatusIcon = cfg.icon;
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{getStudentName(s)}</TableCell>
                          <TableCell className="text-muted-foreground">{getAdmissionNo(s)}</TableCell>
                          <TableCell>{getClassName(s)}</TableCell>
                          <TableCell>{getDate(s)}</TableCell>
                          <TableCell>
                            <Badge variant={cfg.variant}>
                              <StatusIcon className="h-3 w-3 mr-1 inline" />
                              {cfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" title="View Details" onClick={() => setShowView(s)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {st === 'PENDING' && (
                                <>
                                  <Button
                                    variant="ghost" size="icon"
                                    className="text-green-600" title="Approve"
                                    onClick={() => approveMutation.mutate(s.id)}
                                    disabled={approveMutation.isPending}
                                  >
                                    {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                  </Button>
                                  <Button
                                    variant="ghost" size="icon"
                                    className="text-destructive" title="Reject"
                                    onClick={() => rejectMutation.mutate(s.id)}
                                    disabled={rejectMutation.isPending}
                                  >
                                    {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Admission Application</DialogTitle>
            <DialogDescription>Fill in the details to submit a new admission application</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Doe" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Default: password123" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="08012345678" />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class *</Label>
                <Select value={form.currentClassId} onValueChange={v => setForm({ ...form, currentClassId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Home address" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={createMutation.isPending}>
              {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : 'Submit Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showView} onOpenChange={o => { if (!o) setShowView(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Admission Details</DialogTitle>
            <DialogDescription>View complete admission information</DialogDescription>
          </DialogHeader>
          {showView && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserPlus className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{getStudentName(showView)}</h3>
                  <p className="text-sm text-muted-foreground">{getAdmissionNo(showView)}</p>
                </div>
                <div className="ml-auto">
                  <Badge variant={(statusConfig[getStudentStatus(showView)] || statusConfig.PENDING).variant}>
                    {(statusConfig[getStudentStatus(showView)] || statusConfig.PENDING).label}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" /> Email</div>
                  <p>{getEmail(showView)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" /> Phone</div>
                  <p>{getPhone(showView)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground"><GraduationCap className="h-3.5 w-3.5" /> Class</div>
                  <p>{getClassName(showView)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground"><Filter className="h-3.5 w-3.5" /> Gender</div>
                  <p>{getGender(showView)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> Applied</div>
                  <p>{getDate(showView)}</p>
                </div>
                {showView.address && (
                  <div className="space-y-1 col-span-2">
                    <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> Address</div>
                    <p>{showView.address}</p>
                  </div>
                )}
              </div>
              {getStudentStatus(showView) === 'PENDING' && (
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700" onClick={() => { approveMutation.mutate(showView.id); setShowView(null); }} disabled={approveMutation.isPending}>
                    {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Approve
                  </Button>
                  <Button variant="destructive" className="flex-1 gap-2" onClick={() => { rejectMutation.mutate(showView.id); setShowView(null); }} disabled={rejectMutation.isPending}>
                    {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Reject
                  </Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowView(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
