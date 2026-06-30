'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { homeworkApi, subjectApi, classApi, armApi } from '@/lib/endpoints';
import { useAuth } from '@/contexts/auth-context';
import { formatDate } from '@/lib/utils';
import { BookOpen, Search, Plus, MoreHorizontal, Edit, Trash2, Loader2, AlertCircle, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function HomeworkPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tab, setTab] = useState('all');
  const [form, setForm] = useState({ title: '', description: '', subjectId: '', classId: '', armId: '', dueDate: '', maxScore: '' });

  const { data: homeworkData, isLoading: hwLoading, isError: hwError, refetch: refetchHomework } = useQuery({
    queryKey: ['homework', search],
    queryFn: () => homeworkApi.getAll({ search, limit: 50 }).then(r => r.data.data),
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectApi.getAll().then(r => r.data.data),
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classApi.getAll().then(r => r.data.data),
  });

  const { data: armsData } = useQuery({
    queryKey: ['arms'],
    queryFn: () => armApi.getAll().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => homeworkApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      toast({ title: 'Homework created', variant: 'success' });
      setShowAdd(false);
      resetForm();
    },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => homeworkApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      toast({ title: 'Homework updated', variant: 'success' });
      setEditingId(null);
      setShowAdd(false);
      resetForm();
    },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => homeworkApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      toast({ title: 'Homework deleted', variant: 'success' });
    },
    onError: () => toast({ title: 'Error deleting', variant: 'destructive' }),
  });

  const resetForm = () => setForm({ title: '', description: '', subjectId: '', classId: '', armId: '', dueDate: '', maxScore: '' });

  const handleEdit = (hw: any) => {
    setForm({ title: hw.title, description: hw.description || '', subjectId: hw.subjectId || '', classId: hw.classId || '', armId: hw.armId || '', dueDate: hw.dueDate?.split('T')[0] || '', maxScore: hw.maxScore?.toString() || '' });
    setEditingId(hw.id);
    setShowAdd(true);
  };

  const handleSubmit = () => {
    if (!form.title || !form.subjectId || !form.classId || !form.dueDate) {
      toast({ title: 'Please fill in required fields', variant: 'destructive' });
      return;
    }
    const payload = { ...form, maxScore: form.maxScore ? Number(form.maxScore) : undefined };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  };

  const homeworkList = homeworkData?.data || homeworkData?.homeworks || homeworkData || [];

  function getStatusBadge(hw: any) {
    if (!hw.dueDate) return <Badge variant="secondary">No Due Date</Badge>;
    const due = new Date(hw.dueDate);
    const now = new Date();
    if (due < now) return <Badge variant="destructive">Overdue</Badge>;
    const diff = due.getTime() - now.getTime();
    if (diff < 86400000) return <Badge variant="warning">Due Soon</Badge>;
    return <Badge variant="success">Active</Badge>;
  }

  const subjects = subjectsData?.subjects || subjectsData || [];
  const classes = classesData?.classes || classesData || [];
  const arms = armsData?.data || armsData?.arms || armsData || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Homework</h1>
          <p className="text-muted-foreground">Manage and track homework assignments</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingId(null); setShowAdd(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Homework
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All Homework</TabsTrigger>
          <TabsTrigger value="submissions">My Submissions</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Homework</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {hwLoading ? (
                <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
              ) : hwError ? (
                <div className="flex flex-col items-center gap-3 py-8"><AlertCircle className="h-8 w-8 text-destructive" /><p>Failed to load</p><Button variant="outline" onClick={() => refetchHomework()}>Retry</Button></div>
              ) : !homeworkList.length ? (
                <div className="flex flex-col items-center gap-3 py-8"><BookOpen className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No homework assigned</p></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Max Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submissions</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {homeworkList.map((hw: any) => (
                      <TableRow key={hw.id}>
                        <TableCell className="font-medium">{hw.title}</TableCell>
                        <TableCell>{hw.subject?.name || '-'}</TableCell>
                        <TableCell>{hw.class?.name || '-'}{hw.arm ? ` ${hw.arm.name}` : ''}</TableCell>
                        <TableCell>{hw.dueDate ? formatDate(hw.dueDate) : '-'}</TableCell>
                        <TableCell>{hw.maxScore ?? '-'}</TableCell>
                        <TableCell>{getStatusBadge(hw)}</TableCell>
                        <TableCell>{hw._count?.submissions ?? 0}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(hw)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(hw.id); }}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="submissions">
          <Card>
            <CardHeader><CardTitle>My Submissions</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-3 py-8"><FileText className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">Submit your homework assignments here</p></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Homework' : 'Add Homework'}</DialogTitle>
            <DialogDescription>Fill in the details to {editingId ? 'update' : 'assign'} homework</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Homework title" /></div>
            <div className="space-y-2"><Label>Description</Label><textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Subject *</Label>
                <Select value={form.subjectId} onValueChange={v => setForm({ ...form, subjectId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{(Array.isArray(subjects) ? subjects : []).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Class *</Label>
                <Select value={form.classId} onValueChange={v => setForm({ ...form, classId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{(Array.isArray(classes) ? classes : []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Arm</Label>
                <Select value={form.armId} onValueChange={v => setForm({ ...form, armId: v })}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>{(Array.isArray(arms) ? arms : []).map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Max Score</Label><Input type="number" value={form.maxScore} onChange={e => setForm({ ...form, maxScore: e.target.value })} placeholder="100" /></div>
            </div>
            <div className="space-y-2"><Label>Due Date *</Label><Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); resetForm(); setEditingId(null); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : editingId ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
