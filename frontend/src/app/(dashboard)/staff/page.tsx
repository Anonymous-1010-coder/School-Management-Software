'use client';

import { useState, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, Loader2, AlertCircle, Users, GraduationCap, Building2, Wallet } from 'lucide-react';
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

const staffRoles = [
  { value: 'TEACHER', label: 'Teacher' },
  { value: 'CLASS_TEACHER', label: 'Class Teacher' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'LIBRARIAN', label: 'Librarian' },
  { value: 'NURSE', label: 'Nurse' },
  { value: 'HOSTEL_MANAGER', label: 'Hostel Manager' },
  { value: 'RECEPTIONIST', label: 'Receptionist' },
];

const staffSchema = z.object({
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().min(2, 'Last name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
  phone: z.string().min(10, 'Phone number required'),
  role: z.string().min(1, 'Role required'),
  department: z.string().min(1, 'Department required'),
  qualification: z.string().min(1, 'Qualification required'),
  employmentType: z.string().min(1, 'Employment type required'),
  basicSalary: z.string().optional().default(''),
});

type StaffForm = z.infer<typeof staffSchema>;

const defaultForm: StaffForm = {
  firstName: '', lastName: '', email: '', password: '', phone: '', role: '',
  department: '', qualification: '', employmentType: '', basicSalary: '',
};

const roleColorMap: Record<string, string> = {
  TEACHER: 'default',
  CLASS_TEACHER: 'success',
  ACCOUNTANT: 'warning',
  LIBRARIAN: 'info',
  NURSE: 'destructive',
  HOSTEL_MANAGER: 'secondary',
  RECEPTIONIST: 'outline',
};

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<StaffForm>({
    resolver: zodResolver(staffSchema),
    defaultValues: defaultForm,
  });

  const { data: staffData, isLoading, isError, refetch } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.getAll().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => staffApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({ title: 'Staff created', variant: 'success' });
      setShowAdd(false);
      reset(defaultForm);
    },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create staff', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => staffApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({ title: 'Staff updated', variant: 'success' });
      setEditingId(null);
      setShowAdd(false);
      reset(defaultForm);
    },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => staffApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({ title: 'Staff deleted', variant: 'success' });
    },
    onError: () => toast({ title: 'Error deleting staff', variant: 'destructive' }),
  });

  const staff = useMemo(() => {
    const list = staffData?.staff || staffData?.users || staffData || [];
    return Array.isArray(list) ? list : [];
  }, [staffData]);

  const filtered = useMemo(() =>
    staff.filter((s: any) => {
      const q = search.toLowerCase();
      const name = `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.toLowerCase();
      return !q || name.includes(q) || (s.staffNumber || '').toLowerCase().includes(q) || (s.user?.email || '').toLowerCase().includes(q) || (s.role || '').toLowerCase().includes(q);
    }),
    [staff, search],
  );

  const total = staff.length;
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    staff.forEach((s: any) => {
      const role = s.role || 'UNKNOWN';
      counts[role] = (counts[role] || 0) + 1;
    });
    return counts;
  }, [staff]);

  const teaching = (roleCounts['TEACHER'] || 0) + (roleCounts['CLASS_TEACHER'] || 0);
  const nonTeaching = total - teaching;

  const handleEdit = (s: any) => {
    setEditingId(s.id);
    setValue('firstName', s.user?.firstName || '');
    setValue('lastName', s.user?.lastName || '');
    setValue('email', s.user?.email || '');
    setValue('password', '');
    setValue('phone', s.phone || '');
    setValue('role', s.role || '');
    setValue('department', s.department || '');
    setValue('qualification', s.qualification || '');
    setValue('employmentType', s.employmentType || '');
    setValue('basicSalary', s.basicSalary?.toString() || '');
    setShowAdd(true);
  };

  const onSubmit = (data: StaffForm) => {
    const { password, ...rest } = data;
    const payload = { ...rest, basicSalary: data.basicSalary ? Number(data.basicSalary) : undefined };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: password ? { ...payload, password } : payload });
    } else {
      createMutation.mutate({ ...payload, password: password || 'Password123!' });
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Staff</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff</h1>
          <p className="text-muted-foreground">Manage all teaching and non-teaching staff</p>
        </div>
        <Button className="gap-2" onClick={() => { setEditingId(null); reset(defaultForm); setShowAdd(true); }}>
          <Plus className="h-4 w-4" /> Add Staff
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
              <GraduationCap className="h-5 w-5 mx-auto mb-1 text-blue-600" />
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">Total Staff</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-green-600" />
              <p className="text-2xl font-bold text-green-600">{teaching}</p>
              <p className="text-xs text-muted-foreground">Teaching</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Building2 className="h-5 w-5 mx-auto mb-1 text-purple-600" />
              <p className="text-2xl font-bold text-purple-600">{nonTeaching}</p>
              <p className="text-xs text-muted-foreground">Non-Teaching</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Wallet className="h-5 w-5 mx-auto mb-1 text-orange-600" />
              <p className="text-2xl font-bold text-orange-600">{Object.keys(roleCounts).length}</p>
              <p className="text-xs text-muted-foreground">Roles</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Staff Members</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search staff..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-muted-foreground">Failed to load staff</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Users className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">{search ? 'No staff match your search' : 'No staff found'}</p>
              {!search && <Button variant="outline" size="sm" onClick={() => { reset(defaultForm); setShowAdd(true); }}>Add your first staff</Button>}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Employment Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-sm">{s.staffNumber || '-'}</TableCell>
                    <TableCell className="font-medium">{s.user?.firstName} {s.user?.lastName}</TableCell>
                    <TableCell>
                      <Badge variant={roleColorMap[s.role] as any || 'outline'}>
                        {staffRoles.find(r => r.value === s.role)?.label || s.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{s.department || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.employmentType ? s.employmentType.replace(/_/g, ' ') : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.isActive === false ? 'destructive' : 'success'}>
                        {s.isActive === false ? 'Inactive' : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm('Delete this staff member?')) deleteMutation.mutate(s.id); }}>
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
            <DialogTitle>{editingId ? 'Edit Staff' : 'Add New Staff'}</DialogTitle>
            <DialogDescription>Fill in the details to {editingId ? 'update' : 'add'} a staff member</DialogDescription>
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
                <Input type="email" {...register('email')} placeholder="staff@school.com" />
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
                <Label>Role *</Label>
                <Select value={watch('role')} onValueChange={v => setValue('role', v)}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    {staffRoles.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department *</Label>
                <Select value={watch('department')} onValueChange={v => setValue('department', v)}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {['Science', 'Arts', 'Commercial', 'Technical', 'Admin', 'English', 'Mathematics', 'Finance', 'Library', 'Clinic', 'Hostel', 'Front Office'].map(d => (
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
    </div>
  );
}
