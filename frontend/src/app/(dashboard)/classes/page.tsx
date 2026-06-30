'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, Search, Plus, Edit, Trash2, Users, BookOpen, UserCheck, ChevronDown, ChevronRight, Loader2, AlertCircle, GraduationCap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { classApi, studentApi } from '@/lib/endpoints';
import { useAuth } from '@/contexts/auth-context';

export default function ClassesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', academicLevel: '' });

  const { data: classesData, isLoading, isError, refetch } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classApi.getAll().then(r => r.data.data),
  });

  const { data: statsData } = useQuery({
    queryKey: ['class-stats'],
    queryFn: () => classApi.getStats().then(r => r.data.data),
  });

  const { data: studentStats } = useQuery({
    queryKey: ['student-stats'],
    queryFn: () => studentApi.getStats().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => classApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['classes'] }); queryClient.invalidateQueries({ queryKey: ['class-stats'] }); toast({ title: 'Class created', variant: 'success' }); setShowAdd(false); resetForm(); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create class', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => classApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['classes'] }); toast({ title: 'Class updated', variant: 'success' }); setEditingId(null); setShowAdd(false); resetForm(); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => classApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['classes'] }); queryClient.invalidateQueries({ queryKey: ['class-stats'] }); toast({ title: 'Class deleted', variant: 'success' }); },
    onError: () => toast({ title: 'Error deleting class', variant: 'destructive' }),
  });

  const resetForm = () => setForm({ name: '', code: '', description: '', academicLevel: '' });

  const handleEdit = (cls: any) => {
    setForm({ name: cls.name, code: cls.code || '', description: cls.description || '', academicLevel: cls.academicLevel?.toString() || '' });
    setEditingId(cls.id);
    setShowAdd(true);
  };

  const handleSubmit = () => {
    if (!form.name) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    const payload = { ...form, academicLevel: form.academicLevel ? parseInt(form.academicLevel) : undefined, schoolId: user?.schoolId };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  };

  const classes = Array.isArray(classesData) ? classesData : classesData?.classes || [];
  const stats = statsData || {};
  const sStats = studentStats || {};
  const totalStudents = sStats?.totalStudents ?? sStats?.total ?? stats?.totalStudents ?? 0;
  const totalClasses = stats?.totalClasses ?? classes.length;
  const totalArms = stats?.totalArms ?? 0;
  const totalSubjects = stats?.totalSubjects ?? 0;

  const filtered = classes.filter((c: any) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Classes</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Classes</h1><p className="text-muted-foreground">Manage classes and arms</p></div>
        <Button className="gap-2" onClick={() => { resetForm(); setEditingId(null); setShowAdd(true); }}><Plus className="h-4 w-4" /> Add Class</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4 text-center"><Layers className="h-5 w-5 mx-auto mb-1 text-blue-600" /><p className="text-2xl font-bold">{totalClasses}</p><p className="text-xs text-muted-foreground">Total Classes</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Users className="h-5 w-5 mx-auto mb-1 text-green-600" /><p className="text-2xl font-bold">{totalStudents}</p><p className="text-xs text-muted-foreground">Total Students</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><UserCheck className="h-5 w-5 mx-auto mb-1 text-purple-600" /><p className="text-2xl font-bold">{totalArms}</p><p className="text-xs text-muted-foreground">Total Arms</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><BookOpen className="h-5 w-5 mx-auto mb-1 text-orange-600" /><p className="text-2xl font-bold">{totalSubjects}</p><p className="text-xs text-muted-foreground">Subjects</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Classes</CardTitle>
          <div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search classes..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-8"><AlertCircle className="h-8 w-8 text-destructive" /><p className="text-muted-foreground">Failed to load classes</p><Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button></div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center gap-3 py-8"><GraduationCap className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No classes found</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Academic Level</TableHead>
                  <TableHead>Arms</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((cls: any) => (
                  <>
                    <TableRow key={cls.id} className="cursor-pointer" onClick={() => setExpandedId(expandedId === cls.id ? null : cls.id)}>
                      <TableCell>{expandedId === cls.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</TableCell>
                      <TableCell className="font-medium">{cls.name}</TableCell>
                      <TableCell><Badge variant="outline">{cls.code || '-'}</Badge></TableCell>
                      <TableCell>{cls.academicLevel ?? '-'}</TableCell>
                      <TableCell>{cls._count?.arms ?? cls.armCount ?? cls.arms?.length ?? 0}</TableCell>
                      <TableCell><div className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-muted-foreground" />{cls._count?.students ?? cls.studentCount ?? 0}</div></TableCell>
                      <TableCell>{cls._count?.subjects ?? cls.subjectCount ?? 0}</TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(cls)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm('Are you sure you want to delete this class?')) deleteMutation.mutate(cls.id); }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedId === cls.id && (
                      <TableRow key={`${cls.id}-arms`}>
                        <TableCell colSpan={8} className="bg-muted/30 p-4">
                          {cls.arms && cls.arms.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-sm font-medium mb-2">Arms under {cls.name}</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {cls.arms.map((arm: any) => (
                                  <div key={arm.id} className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
                                    <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="font-medium">{arm.name}</span>
                                    {arm._count?.students !== undefined && (
                                      <span className="text-xs text-muted-foreground ml-auto">({arm._count.students})</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No arms configured for this class</p>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Class' : 'Add New Class'}</DialogTitle>
            <DialogDescription>Fill in the details to {editingId ? 'update' : 'add'} a class</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., JSS 1" /></div>
            <div className="space-y-2"><Label>Code</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g., JSS1" /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description" /></div>
            <div className="space-y-2"><Label>Academic Level</Label><Input type="number" value={form.academicLevel} onChange={e => setForm({ ...form, academicLevel: e.target.value })} placeholder="e.g., 1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); resetForm(); setEditingId(null); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>{createMutation.isPending || updateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : editingId ? 'Update' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
