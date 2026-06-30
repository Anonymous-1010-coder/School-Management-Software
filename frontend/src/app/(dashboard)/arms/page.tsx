'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Search, Plus, Edit, Trash2, Loader2, AlertCircle, Users } from 'lucide-react';
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
import { armApi, classApi, staffApi } from '@/lib/endpoints';
import { useAuth } from '@/contexts/auth-context';

export default function ArmsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState('');
  const [form, setForm] = useState({ name: '', code: '', classId: '', classTeacherId: '' });

  const { data: armsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['arms', classFilter],
    queryFn: () => armApi.getAll({ classId: classFilter || undefined }).then(r => r.data.data),
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classApi.getAll().then(r => r.data.data),
  });

  const { data: staffData } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => staffApi.getAll({ role: 'TEACHER' }).then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => armApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['arms'] }); toast({ title: 'Arm created', variant: 'success' }); setShowAdd(false); resetForm(); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create arm', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => armApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['arms'] }); toast({ title: 'Arm updated', variant: 'success' }); setEditingId(null); setShowAdd(false); resetForm(); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => armApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['arms'] }); toast({ title: 'Arm deleted', variant: 'success' }); },
    onError: () => toast({ title: 'Error deleting arm', variant: 'destructive' }),
  });

  const resetForm = () => setForm({ name: '', code: '', classId: '', classTeacherId: '' });

  const handleEdit = (arm: any) => {
    setForm({ name: arm.name, code: arm.code || '', classId: arm.classId || '', classTeacherId: arm.classTeacherId || '' });
    setEditingId(arm.id);
    setShowAdd(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.classId) { toast({ title: 'Name and class are required', variant: 'destructive' }); return; }
    const payload = { ...form, schoolId: user?.schoolId };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  };

  const arms = armsData?.arms || armsData || [];
  const classes = classesData?.classes || classesData || [];
  const teachers = staffData?.staff || staffData?.teachers || staffData || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Arms</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Arms</h1><p className="text-muted-foreground">Manage class arms and sections</p></div>
        <Button className="gap-2" onClick={() => { resetForm(); setEditingId(null); setShowAdd(true); }}><Plus className="h-4 w-4" /> Add Arm</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Arms</CardTitle>
          <div className="flex gap-2 items-center">
            <Select value={classFilter} onValueChange={v => setClassFilter(v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Classes</SelectItem>
                {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search arms..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-8"><AlertCircle className="h-8 w-8 text-destructive" /><p className="text-muted-foreground">Failed to load arms</p><Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button></div>
          ) : !arms.length ? (
            <div className="flex flex-col items-center gap-3 py-8"><GitBranch className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No arms found{classFilter ? ' for this class' : ''}</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Class Teacher</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arms.filter((a: any) => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.code?.toLowerCase().includes(search.toLowerCase())).map((arm: any) => (
                  <TableRow key={arm.id}>
                    <TableCell className="font-medium">{arm.name}</TableCell>
                    <TableCell><Badge variant="outline">{arm.code || '-'}</Badge></TableCell>
                    <TableCell>{arm.class?.name || '-'}</TableCell>
                    <TableCell>{arm.classTeacher ? `${arm.classTeacher.user?.firstName || ''} ${arm.classTeacher.user?.lastName || ''}`.trim() || '-' : '-'}</TableCell>
                    <TableCell><div className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-muted-foreground" />{arm._count?.students ?? arm.studentCount ?? 0}</div></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(arm)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm('Are you sure?')) deleteMutation.mutate(arm.id); }}><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle>{editingId ? 'Edit Arm' : 'Add New Arm'}</DialogTitle>
            <DialogDescription>Fill in the details to {editingId ? 'update' : 'add'} an arm</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., A, B, Gold" /></div>
            <div className="space-y-2"><Label>Code</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g., A, GOLD" /></div>
            <div className="space-y-2"><Label>Class *</Label>
              <Select value={form.classId} onValueChange={v => setForm({ ...form, classId: v })}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>{classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Class Teacher</Label>
              <Select value={form.classTeacherId} onValueChange={v => setForm({ ...form, classTeacherId: v })}>
                <SelectTrigger><SelectValue placeholder="Select teacher (optional)" /></SelectTrigger>
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
    </motion.div>
  );
}
