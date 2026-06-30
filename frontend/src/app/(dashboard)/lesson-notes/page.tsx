'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lessonNoteApi, subjectApi, classApi } from '@/lib/endpoints';
import { formatDate } from '@/lib/utils';
import { BookOpen, Search, Plus, MoreHorizontal, Edit, Trash2, Loader2, AlertCircle, LayoutGrid, List } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function LessonNotesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [form, setForm] = useState({ topic: '', content: '', objectives: '', materials: '', subjectId: '', classId: '', week: '', term: '', session: '' });

  const { data: notesData, isLoading: loading, isError: error, refetch } = useQuery({
    queryKey: ['lesson-notes', search],
    queryFn: () => lessonNoteApi.getAll({ search, limit: 50 }).then(r => r.data.data),
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectApi.getAll().then(r => r.data.data),
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classApi.getAll().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => lessonNoteApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-notes'] });
      toast({ title: 'Lesson note created', variant: 'success' });
      setShowAdd(false);
      resetForm();
    },
    onError: (err: any) => toast({ title: 'Error', description: 'Failed to create', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => lessonNoteApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-notes'] });
      toast({ title: 'Lesson note updated', variant: 'success' });
      setEditingId(null);
      setShowAdd(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => lessonNoteApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-notes'] });
      toast({ title: 'Lesson note deleted', variant: 'success' });
    },
  });

  const resetForm = () => setForm({ topic: '', content: '', objectives: '', materials: '', subjectId: '', classId: '', week: '', term: '', session: '' });

  const handleEdit = (note: any) => {
    setForm({ topic: note.topic, content: note.content || '', objectives: note.objectives || '', materials: note.materials || '', subjectId: note.subjectId || '', classId: note.classId || '', week: note.week?.toString() || '', term: note.term || '', session: note.session || '' });
    setEditingId(note.id);
    setShowAdd(true);
  };

  const handleSubmit = () => {
    if (!form.topic || !form.subjectId || !form.classId) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    const payload = { ...form, week: form.week ? Number(form.week) : undefined };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  };

  const notes = notesData?.data || notesData || [];
  const subjects = subjectsData?.subjects || subjectsData || [];
  const classes = classesData?.classes || classesData || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lesson Notes</h1>
          <p className="text-muted-foreground">Create and manage lesson plans</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setViewMode('table')}><List className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4" /></Button>
          <Button onClick={() => { resetForm(); setEditingId(null); setShowAdd(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Note
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Lesson Notes</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-8"><AlertCircle className="h-8 w-8 text-destructive" /><p>Failed to load</p><Button variant="outline" onClick={() => refetch()}>Retry</Button></div>
          ) : !notes.length ? (
            <div className="flex flex-col items-center gap-3 py-8"><BookOpen className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No lesson notes yet</p></div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Topic</th>
                    <th className="text-left py-3 px-2 font-medium">Subject</th>
                    <th className="text-left py-3 px-2 font-medium">Class</th>
                    <th className="text-left py-3 px-2 font-medium">Week</th>
                    <th className="text-left py-3 px-2 font-medium">Term</th>
                    <th className="text-left py-3 px-2 font-medium">Date</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {notes.map((note: any) => (
                    <tr key={note.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">{note.topic}</td>
                      <td className="py-3 px-2">{note.subject?.name || '-'}</td>
                      <td className="py-3 px-2">{note.class?.name || '-'}</td>
                      <td className="py-3 px-2">{note.week || '-'}</td>
                      <td className="py-3 px-2">{note.term || '-'}</td>
                      <td className="py-3 px-2">{formatDate(note.createdAt)}</td>
                      <td className="py-3 px-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(note)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(note.id); }}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {notes.map((note: any) => (
                <Card key={note.id}>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold">{note.topic}</h3>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">{note.subject?.name}</Badge>
                      <Badge variant="outline">{note.class?.name}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Week {note.week} | {note.term} Term</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Lesson Note' : 'Create Lesson Note'}</DialogTitle>
            <DialogDescription>Plan your lesson with detailed notes</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Topic *</Label><Input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder="Lesson topic" /></div>
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
            <div className="space-y-2"><Label>Objectives</Label><textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={form.objectives} onChange={e => setForm({ ...form, objectives: e.target.value })} placeholder="Learning objectives" /></div>
            <div className="space-y-2"><Label>Content *</Label><textarea className="flex min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Lesson content" /></div>
            <div className="space-y-2"><Label>Materials</Label><textarea className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={form.materials} onChange={e => setForm({ ...form, materials: e.target.value })} placeholder="Teaching materials" /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Week</Label><Input type="number" value={form.week} onChange={e => setForm({ ...form, week: e.target.value })} /></div>
              <div className="space-y-2"><Label>Term</Label><Input value={form.term} onChange={e => setForm({ ...form, term: e.target.value })} placeholder="First" /></div>
              <div className="space-y-2"><Label>Session</Label><Input value={form.session} onChange={e => setForm({ ...form, session: e.target.value })} placeholder="2024/2025" /></div>
            </div>
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
