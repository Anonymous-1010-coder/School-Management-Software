'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookType, Search, Plus, Edit, Trash2, UserPlus, Loader2, AlertCircle, BookOpen } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { subjectApi, classApi, staffApi } from '@/lib/endpoints';
import { useAuth } from '@/contexts/auth-context';

const typeVariants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  CORE: 'default',
  ELECTIVE: 'secondary',
  VOCATIONAL: 'outline',
};

export default function SubjectsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showAssign, setShowAssign] = useState<{ subjectId: string; teacherId: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '', subjectType: '', creditUnit: '', classId: '', teacherId: '' });

  const { data: subjectsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['subjects', classFilter],
    queryFn: () => subjectApi.getAll({ classId: classFilter || undefined }).then(r => r.data.data),
  });

  const { data: statsData } = useQuery({
    queryKey: ['subject-stats'],
    queryFn: () => subjectApi.getStats().then(r => r.data.data),
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classApi.getAll().then(r => r.data.data),
  });

  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => staffApi.getAll({ role: 'TEACHER' }).then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => subjectApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subjects'] }); queryClient.invalidateQueries({ queryKey: ['subject-stats'] }); toast({ title: 'Subject created', variant: 'success' }); setShowAdd(false); resetForm(); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create subject', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => subjectApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subjects'] }); toast({ title: 'Subject updated', variant: 'success' }); setEditingId(null); setShowAdd(false); resetForm(); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subjectApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subjects'] }); queryClient.invalidateQueries({ queryKey: ['subject-stats'] }); toast({ title: 'Subject deleted', variant: 'success' }); },
    onError: () => toast({ title: 'Error deleting subject', variant: 'destructive' }),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, teacherId }: { id: string; teacherId: string }) => subjectApi.assignTeacher(id, teacherId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subjects'] }); queryClient.invalidateQueries({ queryKey: ['subject-stats'] }); toast({ title: 'Teacher assigned', variant: 'success' }); setShowAssign(null); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to assign teacher', variant: 'destructive' }),
  });

  const resetForm = () => setForm({ name: '', code: '', subjectType: '', creditUnit: '', classId: '', teacherId: '' });

  const handleEdit = (sub: any) => {
    setForm({
      name: sub.name,
      code: sub.code || '',
      subjectType: sub.subjectType || sub.type || '',
      creditUnit: sub.creditUnit?.toString() || sub.creditUnits?.toString() || '',
      classId: sub.classId || '',
      teacherId: sub.teacherId || '',
    });
    setEditingId(sub.id);
    setShowAdd(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.subjectType || !form.creditUnit || !form.classId) {
      toast({ title: 'Name, type, credit unit, and class are required', variant: 'destructive' });
      return;
    }
    const payload = {
      ...form,
      creditUnit: parseInt(form.creditUnit),
      teacherId: form.teacherId || undefined,
      schoolId: user?.schoolId,
    };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  };

  const subjects = Array.isArray(subjectsData) ? subjectsData : subjectsData?.subjects || [];
  const classes = Array.isArray(classesData) ? classesData : classesData?.classes || [];
  const teachers = Array.isArray(teachersData) ? teachersData : teachersData?.staff || [];
  const stats = statsData || {};
  const totalSubjects = stats?.totalSubjects ?? subjects.length;
  const withTeacher = stats?.withTeacher ?? stats?.assigned ?? 0;
  const withoutTeacher = stats?.withoutTeacher ?? stats?.unassigned ?? 0;

  const filtered = subjects.filter((s: any) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Subjects</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Subjects</h1><p className="text-muted-foreground">Manage subjects across all classes</p></div>
        <Button className="gap-2" onClick={() => { resetForm(); setEditingId(null); setShowAdd(true); }}><Plus className="h-4 w-4" /> Add Subject</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4 text-center"><BookOpen className="h-5 w-5 mx-auto mb-1 text-blue-600" /><p className="text-2xl font-bold">{totalSubjects}</p><p className="text-xs text-muted-foreground">Total Subjects</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><UserPlus className="h-5 w-5 mx-auto mb-1 text-green-600" /><p className="text-2xl font-bold">{withTeacher}</p><p className="text-xs text-muted-foreground">With Teacher</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><AlertCircle className="h-5 w-5 mx-auto mb-1 text-orange-600" /><p className="text-2xl font-bold">{withoutTeacher}</p><p className="text-xs text-muted-foreground">Without Teacher</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Subjects</CardTitle>
          <div className="flex gap-2 items-center">
            <Select value={classFilter} onValueChange={v => setClassFilter(v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Classes</SelectItem>
                {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search subjects..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-8"><AlertCircle className="h-8 w-8 text-destructive" /><p className="text-muted-foreground">Failed to load subjects</p><Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button></div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center gap-3 py-8"><BookType className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No subjects found</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Credit Unit</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((sub: any) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.name}</TableCell>
                    <TableCell><Badge variant="outline">{sub.code || '-'}</Badge></TableCell>
                    <TableCell><Badge variant={typeVariants[sub.subjectType] || 'default'}>{sub.subjectType}</Badge></TableCell>
                    <TableCell>{sub.creditUnit ?? sub.creditUnits ?? '-'}</TableCell>
                    <TableCell>{sub.class?.name || '-'}</TableCell>
                    <TableCell>
                      {sub.teacher ? (
                        `${sub.teacher.user?.firstName || ''} ${sub.teacher.user?.lastName || ''}`.trim() || sub.teacher.name || 'Assigned'
                      ) : (
                        <span className="text-muted-foreground">Not Assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setShowAssign({ subjectId: sub.id, teacherId: sub.teacherId || '' })} title="Assign Teacher"><UserPlus className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(sub)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm('Are you sure you want to delete this subject?')) deleteMutation.mutate(sub.id); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
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
            <DialogTitle>{editingId ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
            <DialogDescription>Fill in the details to {editingId ? 'update' : 'add'} a subject</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Mathematics" /></div>
            <div className="space-y-2"><Label>Code</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g., MATH" /></div>
            <div className="space-y-2"><Label>Type *</Label>
              <Select value={form.subjectType} onValueChange={v => setForm({ ...form, subjectType: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CORE">Core</SelectItem>
                  <SelectItem value="ELECTIVE">Elective</SelectItem>
                  <SelectItem value="VOCATIONAL">Vocational</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Credit Unit *</Label><Input type="number" value={form.creditUnit} onChange={e => setForm({ ...form, creditUnit: e.target.value })} placeholder="e.g., 3" /></div>
            <div className="space-y-2"><Label>Class *</Label>
              <Select value={form.classId} onValueChange={v => setForm({ ...form, classId: v })}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>{classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Teacher (optional)</Label>
              <Select value={form.teacherId} onValueChange={v => setForm({ ...form, teacherId: v })}>
                <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {teachers.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.user?.firstName} {t.user?.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); resetForm(); setEditingId(null); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>{createMutation.isPending || updateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : editingId ? 'Update' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showAssign} onOpenChange={o => { if (!o) setShowAssign(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Teacher</DialogTitle>
            <DialogDescription>Select a teacher to assign to this subject</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label>Teacher</Label>
            <Select value={showAssign?.teacherId || ''} onValueChange={v => setShowAssign(prev => prev ? { ...prev, teacherId: v } : null)}>
              <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {teachers.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.user?.firstName} {t.user?.lastName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssign(null)}>Cancel</Button>
            <Button onClick={() => { if (showAssign) assignMutation.mutate({ id: showAssign.subjectId, teacherId: showAssign.teacherId }); }} disabled={assignMutation.isPending}>
              {assignMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Assigning...</> : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
