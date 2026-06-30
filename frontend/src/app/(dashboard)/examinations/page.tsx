'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, Search, Plus, Loader2, AlertCircle, Eye, Edit, Trash2, ToggleLeft, ToggleRight, Monitor, FileText, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { examApi, classApi, subjectApi, armApi } from '@/lib/endpoints';
import { formatDate } from '@/lib/utils';

const examTypeBadge: Record<string, 'default' | 'secondary' | 'outline' | 'success' | 'warning'> = {
  CA_TEST: 'warning',
  MID_TERM: 'secondary',
  END_TERM: 'success',
  MOCK: 'outline',
  FINAL: 'default',
};

const examTypes = ['CA_TEST', 'MID_TERM', 'END_TERM', 'MOCK', 'FINAL'];

const emptyForm = {
  title: '',
  examType: '',
  subjectId: '',
  classId: '',
  armId: '',
  term: '',
  session: '',
  duration: '',
  totalMarks: '',
  isCbt: true,
  startDate: '',
  endDate: '',
};

export default function ExaminationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: examsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['exams', typeFilter, subjectFilter, classFilter],
    queryFn: () => examApi.getAll({
      type: typeFilter || undefined,
      subjectId: subjectFilter || undefined,
      classId: classFilter || undefined,
      search: search || undefined,
    }).then(r => r.data.data),
  });

  const { data: statsData } = useQuery({
    queryKey: ['exam-stats'],
    queryFn: () => examApi.getStats().then(r => r.data.data),
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classApi.getAll().then(r => r.data.data),
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectApi.getAll().then(r => r.data.data),
  });

  const { data: armsData } = useQuery({
    queryKey: ['arms'],
    queryFn: () => armApi.getAll().then(r => r.data.data),
  });

  const { data: questionsData } = useQuery({
    queryKey: ['exam-questions', viewingId],
    queryFn: () => viewingId ? examApi.getQuestions(viewingId).then(r => r.data.data) : Promise.resolve(null),
    enabled: !!viewingId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => examApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exam-stats'] });
      toast({ title: 'Exam created', variant: 'success' });
      setShowForm(false);
      resetForm();
    },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create exam', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => examApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exam-stats'] });
      toast({ title: 'Exam updated', variant: 'success' });
      setShowForm(false);
      setEditingId(null);
      resetForm();
    },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update exam', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => examApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exam-stats'] });
      toast({ title: 'Exam deleted', variant: 'success' });
    },
    onError: () => toast({ title: 'Error deleting exam', variant: 'destructive' }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => examApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast({ title: 'Status updated', variant: 'success' });
    },
    onError: () => toast({ title: 'Error toggling status', variant: 'destructive' }),
  });

  const resetForm = () => setForm({ ...emptyForm });

  const handleEdit = (exam: any) => {
    setForm({
      title: exam.title || '',
      examType: exam.examType || '',
      subjectId: exam.subjectId || '',
      classId: exam.classId || '',
      armId: exam.armId || '',
      term: exam.term || '',
      session: exam.session || '',
      duration: exam.duration?.toString() || '',
      totalMarks: exam.totalMarks?.toString() || '',
      isCbt: exam.isCbt ?? true,
      startDate: exam.startDate ? exam.startDate.slice(0, 16) : '',
      endDate: exam.endDate ? exam.endDate.slice(0, 16) : '',
    });
    setEditingId(exam.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.title || !form.examType || !form.classId || !form.term || !form.session) {
      toast({ title: 'Required fields missing', variant: 'destructive' });
      return;
    }
    const payload = {
      title: form.title,
      examType: form.examType,
      subjectId: form.subjectId || undefined,
      classId: form.classId,
      armId: form.armId || undefined,
      term: form.term,
      session: form.session,
      duration: parseInt(form.duration) || 0,
      totalMarks: parseInt(form.totalMarks) || 0,
      isCbt: form.isCbt,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
    };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  };

  const exams = examsData?.exams || examsData || [];
  const stats = statsData || {};
  const classes = classesData?.classes || classesData || [];
  const subjects = subjectsData?.subjects || subjectsData || [];
  const arms = armsData?.arms || armsData || [];
  const questions = questionsData?.questions || questionsData || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="/academic">Academic</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Examinations</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Examinations</h1><p className="text-muted-foreground">Manage exams, tests, and assessments</p></div>
        <Button className="gap-2" onClick={() => { resetForm(); setEditingId(null); setShowForm(true); }}><Plus className="h-4 w-4" /> Create Exam</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4 text-center"><ClipboardCheck className="h-5 w-5 mx-auto mb-1 text-blue-600" /><p className="text-2xl font-bold">{stats.totalExams ?? stats.total ?? 0}</p><p className="text-xs text-muted-foreground">Total Exams</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Clock className="h-5 w-5 mx-auto mb-1 text-green-600" /><p className="text-2xl font-bold">{stats.activeExams ?? stats.active ?? 0}</p><p className="text-xs text-muted-foreground">Active Exams</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Monitor className="h-5 w-5 mx-auto mb-1 text-purple-600" /><p className="text-2xl font-bold">{stats.cbtExams ?? 0}</p><p className="text-xs text-muted-foreground">CBT Exams</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><FileText className="h-5 w-5 mx-auto mb-1 text-orange-600" /><p className="text-2xl font-bold">{stats.theoryExams ?? 0}</p><p className="text-xs text-muted-foreground">Theory Exams</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle>All Examinations</CardTitle>
          <div className="flex gap-2 items-center flex-wrap">
            <Select value={typeFilter} onValueChange={v => setTypeFilter(v)}>
              <SelectTrigger className="w-32"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {examTypes.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={subjectFilter} onValueChange={v => setSubjectFilter(v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Subject" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Subjects</SelectItem>
                {subjects.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={classFilter} onValueChange={v => setClassFilter(v)}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Classes</SelectItem>
                {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative w-56"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search exams..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-8"><AlertCircle className="h-8 w-8 text-destructive" /><p className="text-muted-foreground">Failed to load examinations</p><Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button></div>
          ) : !exams.length ? (
            <div className="flex flex-col items-center gap-3 py-8"><ClipboardCheck className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No examinations found</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Total Marks</TableHead>
                  <TableHead>CBT</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam: any) => (
                  <TableRow key={exam.id}>
                    <TableCell className="font-medium">{exam.title}</TableCell>
                    <TableCell><Badge variant={examTypeBadge[exam.examType] || 'outline'}>{exam.examType?.replace(/_/g, ' ') || '-'}</Badge></TableCell>
                    <TableCell>{exam.subject?.name || '-'}</TableCell>
                    <TableCell>{exam.class?.name || '-'}</TableCell>
                    <TableCell>{exam.duration ? `${exam.duration}min` : '-'}</TableCell>
                    <TableCell>{exam.totalMarks ?? '-'}</TableCell>
                    <TableCell><Badge variant={exam.isCbt ? 'success' : 'secondary'}>{exam.isCbt ? 'Yes' : 'No'}</Badge></TableCell>
                    <TableCell><Badge variant={exam.status === 'ACTIVE' ? 'success' : 'secondary'}>{exam.status || 'INACTIVE'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewingId(exam.id)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(exam)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm('Delete this exam?')) deleteMutation.mutate(exam.id); }}><Trash2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleMutation.mutate({ id: exam.id, status: exam.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}>
                          {exam.status === 'ACTIVE' ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
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

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Exam' : 'Create Exam'}</DialogTitle>
            <DialogDescription>Fill in the details to {editingId ? 'update the' : 'create a new'} examination</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., First Term Examination" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Exam Type *</Label>
                <Select value={form.examType} onValueChange={v => setForm({ ...form, examType: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {examTypes.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Subject</Label>
                <Select value={form.subjectId} onValueChange={v => setForm({ ...form, subjectId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select subject (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {subjects.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Class *</Label>
                <Select value={form.classId} onValueChange={v => setForm({ ...form, classId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Arm</Label>
                <Select value={form.armId} onValueChange={v => setForm({ ...form, armId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select arm (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {arms.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Term *</Label>
                <Select value={form.term} onValueChange={v => setForm({ ...form, term: v })}>
                  <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIRST">First Term</SelectItem>
                    <SelectItem value="SECOND">Second Term</SelectItem>
                    <SelectItem value="THIRD">Third Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Session *</Label>
                <Select value={form.session} onValueChange={v => setForm({ ...form, session: v })}>
                  <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024/2025">2024/2025</SelectItem>
                    <SelectItem value="2025/2026">2025/2026</SelectItem>
                    <SelectItem value="2026/2027">2026/2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Duration (minutes)</Label><Input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="e.g., 120" /></div>
              <div className="space-y-2"><Label>Total Marks</Label><Input type="number" value={form.totalMarks} onChange={e => setForm({ ...form, totalMarks: e.target.value })} placeholder="e.g., 100" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Date</Label><Input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
              <div className="space-y-2"><Label>End Date</Label><Input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isCbt} onCheckedChange={v => setForm({ ...form, isCbt: v })} />
              <Label>CBT Exam</Label>
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

      <Dialog open={!!viewingId} onOpenChange={o => { if (!o) setViewingId(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Exam Details</DialogTitle>
            <DialogDescription>View exam information and questions</DialogDescription>
          </DialogHeader>
          {viewingId && (() => {
            const exam = exams.find((e: any) => e.id === viewingId);
            if (!exam) return <p>Exam not found</p>;
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Title:</span> <span className="font-medium">{exam.title}</span></div>
                  <div><span className="text-muted-foreground">Type:</span> <Badge variant={examTypeBadge[exam.examType] || 'outline'}>{exam.examType?.replace(/_/g, ' ')}</Badge></div>
                  <div><span className="text-muted-foreground">Subject:</span> {exam.subject?.name || '-'}</div>
                  <div><span className="text-muted-foreground">Class:</span> {exam.class?.name || '-'}</div>
                  <div><span className="text-muted-foreground">Duration:</span> {exam.duration ? `${exam.duration}min` : '-'}</div>
                  <div><span className="text-muted-foreground">Total Marks:</span> {exam.totalMarks ?? '-'}</div>
                  <div><span className="text-muted-foreground">Term:</span> {exam.term || '-'}</div>
                  <div><span className="text-muted-foreground">Session:</span> {exam.session || '-'}</div>
                  <div><span className="text-muted-foreground">CBT:</span> {exam.isCbt ? 'Yes' : 'No'}</div>
                  <div><span className="text-muted-foreground">Status:</span> <Badge variant={exam.status === 'ACTIVE' ? 'success' : 'secondary'}>{exam.status || 'INACTIVE'}</Badge></div>
                  <div><span className="text-muted-foreground">Start:</span> {exam.startDate ? formatDate(exam.startDate) : '-'}</div>
                  <div><span className="text-muted-foreground">End:</span> {exam.endDate ? formatDate(exam.endDate) : '-'}</div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Questions ({questions.length})</h4>
                  {!questions.length ? (
                    <p className="text-sm text-muted-foreground">No questions added yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {questions.map((q: any, i: number) => (
                        <div key={q.id || i} className="border rounded-lg p-3 text-sm">
                          <p className="font-medium">Q{i + 1}. {q.questionText || q.question}</p>
                          {q.options && q.options.length > 0 && (
                            <ul className="ml-4 mt-1 space-y-0.5 list-disc">
                              {q.options.map((opt: string, j: number) => (
                                <li key={j} className={opt === q.correctAnswer ? 'text-green-600 font-medium' : ''}>{opt}</li>
                              ))}
                            </ul>
                          )}
                          {q.correctAnswer && <p className="text-green-600 mt-1">Answer: {q.correctAnswer}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingId(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
