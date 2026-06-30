'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Search, Plus, Loader2, AlertCircle, Edit, Trash2, Upload, CheckCheck, Award, TrendingUp, TrendingDown } from 'lucide-react';
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
import { resultApi, examApi, classApi, subjectApi, studentApi } from '@/lib/endpoints';

const gradeVariant: Record<string, 'success' | 'default' | 'warning' | 'destructive'> = {
  A: 'success',
  B: 'default',
  C: 'warning',
  D: 'destructive',
  F: 'destructive',
};

const terms = ['FIRST', 'SECOND', 'THIRD'];
const sessions = ['2024/2025', '2025/2026', '2026/2027'];

const emptyForm = {
  studentId: '',
  examId: '',
  subjectId: '',
  score: '',
  grade: '',
  remark: '',
};

export default function ResultsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [examFilter, setExamFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: resultsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['results', classFilter, examFilter, termFilter, sessionFilter, search],
    queryFn: () => resultApi.getAll({
      classId: classFilter || undefined,
      examId: examFilter || undefined,
      term: termFilter || undefined,
      session: sessionFilter || undefined,
      search: search || undefined,
    }).then(r => r.data.data),
  });

  const { data: statsData } = useQuery({
    queryKey: ['result-stats'],
    queryFn: () => resultApi.getStats().then(r => r.data.data),
  });

  const { data: examsData } = useQuery({
    queryKey: ['exams'],
    queryFn: () => examApi.getAll().then(r => r.data.data),
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classApi.getAll().then(r => r.data.data),
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectApi.getAll().then(r => r.data.data),
  });

  const { data: studentsData } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentApi.getAll({ limit: 200 }).then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => resultApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
      queryClient.invalidateQueries({ queryKey: ['result-stats'] });
      toast({ title: 'Result added', variant: 'success' });
      setShowForm(false);
      resetForm();
    },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to add result', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => resultApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
      toast({ title: 'Result updated', variant: 'success' });
      setShowForm(false);
      setEditingId(null);
      resetForm();
    },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => resultApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
      toast({ title: 'Result deleted', variant: 'success' });
    },
    onError: () => toast({ title: 'Error deleting result', variant: 'destructive' }),
  });

  const publishMutation = useMutation({
    mutationFn: (ids: string[]) => resultApi.publish({ resultIds: ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
      toast({ title: 'Results published', variant: 'success' });
      setSelectedIds(new Set());
    },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to publish', variant: 'destructive' }),
  });

  const resetForm = () => setForm({ ...emptyForm });

  const handleEdit = (result: any) => {
    setForm({
      studentId: result.studentId || '',
      examId: result.examId || '',
      subjectId: result.subjectId || '',
      score: result.score?.toString() || '',
      grade: result.grade || '',
      remark: result.remark || '',
    });
    setEditingId(result.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.studentId || !form.examId || !form.subjectId || !form.score) {
      toast({ title: 'Student, exam, subject and score are required', variant: 'destructive' });
      return;
    }
    const payload = {
      studentId: form.studentId,
      examId: form.examId,
      subjectId: form.subjectId,
      score: parseFloat(form.score),
      grade: form.grade || undefined,
      remark: form.remark || undefined,
    };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === results.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(results.map((r: any) => r.id)));
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const results = resultsData?.results || resultsData || [];
  const stats = statsData || {};
  const exams = examsData?.exams || examsData || [];
  const classes = classesData?.classes || classesData || [];
  const subjects = subjectsData?.subjects || subjectsData || [];
  const students = studentsData?.students || studentsData || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="/academic">Academic</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Results</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Results</h1><p className="text-muted-foreground">View and manage academic results</p></div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button variant="outline" className="gap-2" onClick={() => publishMutation.mutate(Array.from(selectedIds))} disabled={publishMutation.isPending}>
              {publishMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              Publish Selected ({selectedIds.size})
            </Button>
          )}
          <Button variant="outline" className="gap-2"><Upload className="h-4 w-4" /> Bulk Upload</Button>
          <Button className="gap-2" onClick={() => { resetForm(); setEditingId(null); setShowForm(true); }}><Plus className="h-4 w-4" /> Add Result</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4 text-center"><Award className="h-5 w-5 mx-auto mb-1 text-blue-600" /><p className="text-2xl font-bold">{stats.totalResults ?? stats.total ?? 0}</p><p className="text-xs text-muted-foreground">Total Results</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-600" /><p className="text-2xl font-bold">{stats.publishedResults ?? stats.published ?? 0}</p><p className="text-xs text-muted-foreground">Published</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><TrendingDown className="h-5 w-5 mx-auto mb-1 text-orange-600" /><p className="text-2xl font-bold">{stats.pendingResults ?? stats.pending ?? 0}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><FileSpreadsheet className="h-5 w-5 mx-auto mb-1 text-purple-600" /><p className="text-2xl font-bold">{stats.classes ?? stats.totalClasses ?? '-'}</p><p className="text-xs text-muted-foreground">Classes</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle>Examination Results</CardTitle>
          <div className="flex gap-2 items-center flex-wrap">
            <Select value={classFilter} onValueChange={v => { setClassFilter(v); setSelectedIds(new Set()); }}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Classes</SelectItem>
                {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={examFilter} onValueChange={v => { setExamFilter(v); setSelectedIds(new Set()); }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Exam" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Exams</SelectItem>
                {exams.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={termFilter} onValueChange={v => { setTermFilter(v); setSelectedIds(new Set()); }}>
              <SelectTrigger className="w-28"><SelectValue placeholder="Term" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Terms</SelectItem>
                {terms.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sessionFilter} onValueChange={v => { setSessionFilter(v); setSelectedIds(new Set()); }}>
              <SelectTrigger className="w-28"><SelectValue placeholder="Session" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Sessions</SelectItem>
                {sessions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative w-56"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by student..." className="pl-8" value={search} onChange={e => { setSearch(e.target.value); setSelectedIds(new Set()); }} /></div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-8"><AlertCircle className="h-8 w-8 text-destructive" /><p className="text-muted-foreground">Failed to load results</p><Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button></div>
          ) : !results.length ? (
            <div className="flex flex-col items-center gap-3 py-8"><FileSpreadsheet className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No results found</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input type="checkbox" className="h-4 w-4" checked={results.length > 0 && selectedIds.size === results.length} onChange={toggleSelectAll} />
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell><input type="checkbox" className="h-4 w-4" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} /></TableCell>
                    <TableCell className="font-medium">{r.student ? `${r.student.user?.firstName || ''} ${r.student.user?.lastName || ''}`.trim() || '-' : '-'}</TableCell>
                    <TableCell>{r.subject?.name || '-'}</TableCell>
                    <TableCell>{r.score ?? '-'}</TableCell>
                    <TableCell><Badge variant={gradeVariant[r.grade] || 'default'}>{r.grade || '-'}</Badge></TableCell>
                    <TableCell>{r.exam?.title || '-'}</TableCell>
                    <TableCell>{r.term || '-'}</TableCell>
                    <TableCell>{r.session || '-'}</TableCell>
                    <TableCell><Badge variant={r.isPublished ? 'success' : 'secondary'}>{r.isPublished ? 'Yes' : 'No'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(r)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm('Delete this result?')) deleteMutation.mutate(r.id); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Result' : 'Add Result'}</DialogTitle>
            <DialogDescription>Fill in the details to {editingId ? 'update the' : 'add a'} result</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Student *</Label>
              <Select value={form.studentId} onValueChange={v => setForm({ ...form, studentId: v })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.user?.firstName} {s.user?.lastName} ({s.admissionNumber || ''})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Exam *</Label>
              <Select value={form.examId} onValueChange={v => setForm({ ...form, examId: v })}>
                <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
                <SelectContent>
                  {exams.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Subject *</Label>
              <Select value={form.subjectId} onValueChange={v => setForm({ ...form, subjectId: v })}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Score *</Label><Input type="number" value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} placeholder="e.g., 85" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Grade</Label>
                <Select value={form.grade} onValueChange={v => setForm({ ...form, grade: v })}>
                  <SelectTrigger><SelectValue placeholder="Grade (auto)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Auto</SelectItem>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                    <SelectItem value="F">F</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Remark</Label><Input value={form.remark} onChange={e => setForm({ ...form, remark: e.target.value })} placeholder="Optional remark" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); setEditingId(null); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : editingId ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
