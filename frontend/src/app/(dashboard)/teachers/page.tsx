'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Edit, Trash2, Loader2, AlertCircle, Users, BookOpen, UserCheck, GraduationCap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { staffApi } from '@/lib/endpoints';

const teacherSchema = z.object({
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().min(2, 'Last name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
  phone: z.string().min(10, 'Phone number required'),
  gender: z.string().min(1, 'Gender required'),
  department: z.string().min(1, 'Department required'),
  qualification: z.string().min(1, 'Qualification required'),
  specialization: z.string().optional().default(''),
  employmentType: z.string().min(1, 'Employment type required'),
  dateEmployed: z.string().min(1, 'Date employed required'),
  basicSalary: z.string().optional().default(''),
});

type TeacherForm = z.infer<typeof teacherSchema>;

const defaultForm: TeacherForm = {
  firstName: '', lastName: '', email: '', password: '', phone: '', gender: '',
  department: '', qualification: '', specialization: '', employmentType: '',
  dateEmployed: '', basicSalary: '',
};

export default function TeachersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TeacherForm>({
    resolver: zodResolver(teacherSchema),
    defaultValues: defaultForm,
  });

  const { data: teachersData, isLoading, isError, refetch } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => staffApi.getAll({ role: 'TEACHER' }).then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => staffApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast({ title: 'Teacher created', variant: 'success' });
      setShowAdd(false);
      reset(defaultForm);
    },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create teacher', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => staffApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast({ title: 'Teacher updated', variant: 'success' });
      setEditingId(null);
      setShowAdd(false);
      reset(defaultForm);
    },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => staffApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast({ title: 'Teacher deleted', variant: 'success' });
    },
    onError: () => toast({ title: 'Error deleting teacher', variant: 'destructive' }),
  });

  const teachers = useMemo(() => {
    const list = teachersData?.staff || teachersData?.teachers || teachersData || [];
    return Array.isArray(list) ? list : [];
  }, [teachersData]);

  const filtered = useMemo(() =>
    teachers.filter((t: any) => {
      const q = search.toLowerCase();
      const name = `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.toLowerCase();
      return !q || name.includes(q) || (t.staffNumber || '').toLowerCase().includes(q) || (t.user?.email || '').toLowerCase().includes(q);
    }),
    [teachers, search],
  );

  const total = teachers.length;
  const active = teachers.filter((t: any) => t.isActive !== false).length;
  const uniqueDepts = new Set(teachers.map((t: any) => t.department).filter(Boolean)).size;
  const fullTime = teachers.filter((t: any) => t.employmentType === 'FULL_TIME').length;

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setValue('firstName', t.user?.firstName || '');
    setValue('lastName', t.user?.lastName || '');
    setValue('email', t.user?.email || '');
    setValue('password', '');
    setValue('phone', t.phone || '');
    setValue('gender', t.gender || '');
    setValue('department', t.department || '');
    setValue('qualification', t.qualification || '');
    setValue('specialization', t.specialization || '');
    setValue('employmentType', t.employmentType || '');
    setValue('dateEmployed', t.dateEmployed ? t.dateEmployed.split('T')[0] : '');
    setValue('basicSalary', t.basicSalary?.toString() || '');
    setShowAdd(true);
  };

  const onSubmit = (data: TeacherForm) => {
    const payload = { ...data, basicSalary: data.basicSalary ? Number(data.basicSalary) : undefined, role: 'TEACHER' };
    if (editingId) {
      if (!data.password) (payload as any).password = undefined;
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="/staff">Staff</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Teachers</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
          <p className="text-muted-foreground">Manage teaching staff and class assignments</p>
        </div>
        <Button className="gap-2" onClick={() => { setEditingId(null); reset(defaultForm); setShowAdd(true); }}>
          <Plus className="h-4 w-4" /> Add Teacher
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[1,2,3,4].map(i => <Card key={i}><CardContent className="p-4 text-center"><Skeleton className="h-8 w-12 mx-auto mb-1" /><Skeleton className="h-4 w-20 mx-auto" /></CardContent></Card>)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 text-center">
              <GraduationCap className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">Total Teachers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <UserCheck className="h-5 w-5 mx-auto mb-1 text-green-600" />
              <p className="text-2xl font-bold text-green-600">{active}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="h-5 w-5 mx-auto mb-1 text-blue-600" />
              <p className="text-2xl font-bold text-blue-600">{uniqueDepts}</p>
              <p className="text-xs text-muted-foreground">Departments</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-purple-600" />
              <p className="text-2xl font-bold text-purple-600">{fullTime}</p>
              <p className="text-xs text-muted-foreground">Full Time</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Teachers</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search teachers..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-muted-foreground">Failed to load teachers</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Users className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">{search ? 'No teachers match your search' : 'No teachers found'}</p>
              {!search && <Button variant="outline" size="sm" onClick={() => { reset(defaultForm); setShowAdd(true); }}>Add your first teacher</Button>}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-sm">{t.staffNumber || '-'}</TableCell>
                    <TableCell className="font-medium">{t.user?.firstName} {t.user?.lastName}</TableCell>
                    <TableCell>{t.user?.email || '-'}</TableCell>
                    <TableCell>{t.phone || '-'}</TableCell>
                    <TableCell>{t.department || '-'}</TableCell>
                    <TableCell>
                      {t.subjects?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {t.subjects.slice(0, 2).map((s: any) => (
                            <Badge key={s.id} variant="outline" className="text-xs">{s.name}</Badge>
                          ))}
                          {t.subjects.length > 2 && <Badge variant="outline" className="text-xs">+{t.subjects.length - 2}</Badge>}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.isActive === false ? 'destructive' : 'success'}>
                        {t.isActive === false ? 'Inactive' : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm('Delete this teacher?')) deleteMutation.mutate(t.id); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={(open) => { if (!open) { setShowAdd(false); setEditingId(null); reset(defaultForm); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
            <DialogDescription>Fill in the details to {editingId ? 'update' : 'add'} a teacher</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input {...register('firstName')} placeholder="John" />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input {...register('lastName')} placeholder="Doe" />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" {...register('email')} placeholder="teacher@school.com" />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Password {editingId && '(leave blank to keep)'} *</Label>
                <Input type="password" {...register('password')} placeholder={editingId ? 'Leave blank' : '••••••••'} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input {...register('phone')} placeholder="+234 800 000 0000" />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Gender *</Label>
                <Select value={watch('gender')} onValueChange={v => setValue('gender', v)}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-xs text-destructive">{errors.gender.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department *</Label>
                <Select value={watch('department')} onValueChange={v => setValue('department', v)}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {['Science', 'Arts', 'Commercial', 'Technical', 'Admin', 'English', 'Mathematics'].map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Qualification *</Label>
                <Select value={watch('qualification')} onValueChange={v => setValue('qualification', v)}>
                  <SelectTrigger><SelectValue placeholder="Select qualification" /></SelectTrigger>
                  <SelectContent>
                    {['NCE', 'OND', 'HND', "Bachelor's", "Master's", 'PhD'].map(q => (
                      <SelectItem key={q} value={q}>{q}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.qualification && <p className="text-xs text-destructive">{errors.qualification.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Specialization</Label>
                <Input {...register('specialization')} placeholder="e.g., Mathematics" />
                {errors.specialization && <p className="text-xs text-destructive">{errors.specialization.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Employment Type *</Label>
                <Select value={watch('employmentType')} onValueChange={v => setValue('employmentType', v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_TIME">Full Time</SelectItem>
                    <SelectItem value="PART_TIME">Part Time</SelectItem>
                    <SelectItem value="CONTRACT">Contract</SelectItem>
                  </SelectContent>
                </Select>
                {errors.employmentType && <p className="text-xs text-destructive">{errors.employmentType.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date Employed *</Label>
                <Input type="date" {...register('dateEmployed')} />
                {errors.dateEmployed && <p className="text-xs text-destructive">{errors.dateEmployed.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Basic Salary</Label>
                <Input type="number" {...register('basicSalary')} placeholder="0.00" />
                {errors.basicSalary && <p className="text-xs text-destructive">{errors.basicSalary.message}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowAdd(false); setEditingId(null); reset(defaultForm); }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : editingId ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
