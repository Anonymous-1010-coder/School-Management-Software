'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Printer, Loader2, AlertCircle, Search, Award, BookOpen,
  GraduationCap, BarChart3, Download,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { resultApi, studentApi, classApi, armApi } from '@/lib/endpoints';

const terms = ['First', 'Second', 'Third'];
const sessions = ['2023/2024', '2024/2025', '2025/2026'];

export default function ReportCardsPage() {
  const printRef = useRef<HTMLDivElement>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [term, setTerm] = useState('');
  const [session, setSession] = useState('');
  const [classId, setClassId] = useState('ALL');
  const [armId, setArmId] = useState('ALL');

  const { data: classesData } = useQuery({
    queryKey: ['classes-report-cards'],
    queryFn: () => classApi.getAll().then(r => r.data.data || []),
  });

  const { data: armsData } = useQuery({
    queryKey: ['arms-report-cards', classId],
    queryFn: () => armApi.getAll({ classId: classId === 'ALL' ? undefined : classId }).then(r => r.data.data || []),
    enabled: classId !== 'ALL',
  });

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-report-cards', classId, armId],
    queryFn: () => studentApi.getAll({
      limit: 200,
      classId: classId === 'ALL' ? undefined : classId,
      armId: armId === 'ALL' ? undefined : armId,
    }).then(r => r.data.data),
  });

  const {
    data: reportData, isLoading: reportLoading, isError: reportError, refetch: refetchReport,
  } = useQuery({
    queryKey: ['report-card', selectedStudent, term, session],
    queryFn: () => resultApi.getReportCard(selectedStudent, term, session).then(r => r.data.data),
    enabled: !!selectedStudent && !!term && !!session,
  });

  const classes = Array.isArray(classesData) ? classesData : [];
  const arms = Array.isArray(armsData) ? armsData : [];
  const rawStudents = studentsData?.students || studentsData || [];
  const students = Array.isArray(rawStudents) ? rawStudents : [];

  const filteredStudents = students.filter((s: any) => {
    if (!studentSearch) return true;
    const name = `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.toLowerCase();
    const admission = (s.admissionNumber || '').toLowerCase();
    const q = studentSearch.toLowerCase();
    return name.includes(q) || admission.includes(q);
  });

  const generatedCount = reportData ? 1 : 0;
  const totalStudents = students.length;

  const handlePrint = () => window.print();

  const getGrade = (score: number): { grade: string; remark: string } => {
    if (score >= 75) return { grade: 'A', remark: 'Excellent' };
    if (score >= 65) return { grade: 'B', remark: 'Very Good' };
    if (score >= 55) return { grade: 'C', remark: 'Good' };
    if (score >= 45) return { grade: 'D', remark: 'Fair' };
    return { grade: 'F', remark: 'Needs Improvement' };
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Report Cards</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report Cards</h1>
          <p className="text-muted-foreground">Generate and view student report cards</p>
        </div>
        {reportData && (
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handlePrint}>
              <Download className="h-4 w-4" /> Download
            </Button>
            <Button className="gap-2" onClick={handlePrint}>
              <Printer className="h-4 w-4" /> Print Report Card
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <GraduationCap className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <p className="text-2xl font-bold">{totalStudents}</p>
            <p className="text-xs text-muted-foreground">Total Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="h-5 w-5 mx-auto mb-1 text-purple-600" />
            <p className="text-2xl font-bold">{classes.length}</p>
            <p className="text-xs text-muted-foreground">Classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-bold">{terms.length}</p>
            <p className="text-xs text-muted-foreground">Terms</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-5 w-5 mx-auto mb-1 text-orange-600" />
            <p className="text-2xl font-bold">{generatedCount}</p>
            <p className="text-xs text-muted-foreground">Generated</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Select Report Criteria</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={classId} onValueChange={v => { setClassId(v); setArmId('ALL'); setSelectedStudent(''); }}>
                <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Classes</SelectItem>
                  {classes.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Arm</Label>
              <Select value={armId} onValueChange={v => { setArmId(v); setSelectedStudent(''); }} disabled={classId === 'ALL'}>
                <SelectTrigger><SelectValue placeholder={classId === 'ALL' ? 'Select class first' : 'All arms'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Arms</SelectItem>
                  {arms.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Term</Label>
              <Select value={term} onValueChange={v => setTerm(v)}>
                <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                <SelectContent>
                  {terms.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Session</Label>
              <Select value={session} onValueChange={v => setSession(v)}>
                <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                <SelectContent>
                  {sessions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={selectedStudent} onValueChange={v => setSelectedStudent(v)}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search students..."
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  {studentsLoading ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">Loading...</div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">No students found</div>
                  ) : (
                    filteredStudents.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.user?.firstName} {s.user?.lastName} ({s.admissionNumber})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 self-end">
              <Button
                className="w-full gap-2"
                onClick={() => refetchReport()}
                disabled={!selectedStudent || !term || !session}
              >
                <FileText className="h-4 w-4" /> Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportLoading && (
        <Card>
          <CardContent className="py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            <p className="mt-2 text-muted-foreground">Loading report card...</p>
          </CardContent>
        </Card>
      )}

      {reportError && (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
            <p className="mt-2 text-muted-foreground">Failed to load report card. The student may not have results for this term.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refetchReport()}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {reportData && !reportLoading && (
        <div ref={printRef} className="print-area">
          <Card className="print:shadow-none print:border-none">
            <CardHeader className="text-center border-b print:border-b-2">
              <CardTitle className="text-2xl">REPORT CARD</CardTitle>
              <p className="text-muted-foreground">{reportData.schoolName || 'School Name'}</p>
              <p className="text-sm text-muted-foreground">{term} Term - {session} Session</p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <span className="font-medium">Student Name:</span>{' '}
                  {reportData.student?.user?.firstName} {reportData.student?.user?.lastName}
                </div>
                <div>
                  <span className="font-medium">Admission No:</span>{' '}
                  {reportData.student?.admissionNumber}
                </div>
                <div>
                  <span className="font-medium">Class:</span>{' '}
                  {reportData.student?.currentClass?.name} {reportData.arm?.name || ''}
                </div>
                <div>
                  <span className="font-medium">Term:</span> {term} Term
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center">CA Score</TableHead>
                    <TableHead className="text-center">Exam Score</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead>Remark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(reportData.subjects || reportData.results || []).map((subj: any, i: number) => {
                    const total = subj.total ?? (subj.caScore || 0) + (subj.examScore || 0) + (subj.testScore || 0);
                    const grade = getGrade(total);
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{subj.subject?.name || subj.subjectName || '-'}</TableCell>
                        <TableCell className="text-center">{subj.caScore ?? subj.testScore ?? '-'}</TableCell>
                        <TableCell className="text-center">{subj.examScore ?? '-'}</TableCell>
                        <TableCell className="text-center font-medium">{total}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={
                            grade.grade === 'A' ? 'success' as any
                            : grade.grade === 'F' ? 'destructive' as any
                            : grade.grade === 'D' ? 'warning' as any
                            : 'default' as any
                          }>
                            {grade.grade}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{grade.remark}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex justify-end gap-8 mt-6 text-sm">
                <div><span className="font-medium">Total Score:</span> {reportData.total ?? '-'}</div>
                <div><span className="font-medium">Average:</span> {reportData.average ?? '-'}</div>
                <div><span className="font-medium">Position:</span> {reportData.position ?? '-'}</div>
              </div>

              {(reportData.teacherComment || reportData.principalComment) && (
                <div className="mt-6 space-y-3 text-sm border-t pt-4">
                  {reportData.teacherComment && (
                    <div><span className="font-medium">Teacher's Comment:</span> {reportData.teacherComment}</div>
                  )}
                  {reportData.principalComment && (
                    <div><span className="font-medium">Principal's Comment:</span> {reportData.principalComment}</div>
                  )}
                </div>
              )}

              {(reportData.nextTermBegins || reportData.nextTermFee) && (
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm border-t pt-4">
                  {reportData.nextTermBegins && (
                    <div><span className="font-medium">Next Term Begins:</span> {new Date(reportData.nextTermBegins).toLocaleDateString()}</div>
                  )}
                  {reportData.nextTermFee && (
                    <div><span className="font-medium">Next Term Fee:</span> ₦{Number(reportData.nextTermFee).toLocaleString()}</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .print-area .print\\:shadow-none { box-shadow: none !important; }
          .print-area .print\\:border-none { border: none !important; }
          .print-area .print\\:border-b-2 { border-bottom-width: 2px !important; }
        }
      `}</style>
    </motion.div>
  );
}
