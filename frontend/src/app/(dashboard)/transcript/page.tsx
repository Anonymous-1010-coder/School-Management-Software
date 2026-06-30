'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Printer, Loader2, AlertCircle, Download, Award, GraduationCap,
  BookOpen, BarChart3, Search,
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
import { resultApi, studentApi } from '@/lib/endpoints';

export default function TranscriptPage() {
  const printRef = useRef<HTMLDivElement>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-transcript'],
    queryFn: () => studentApi.getAll({ limit: 200 }).then(r => r.data.data),
  });

  const {
    data: resultsData, isLoading: resultsLoading, isError: resultsError, refetch: refetchResults,
  } = useQuery({
    queryKey: ['transcript', selectedStudent],
    queryFn: () => resultApi.getAll({ studentId: selectedStudent, limit: 500 }).then(r => r.data.data),
    enabled: !!selectedStudent,
  });

  const rawStudents = studentsData?.students || studentsData || [];
  const students = Array.isArray(rawStudents) ? rawStudents : [];
  const rawResults = resultsData?.results || resultsData || [];
  const results = Array.isArray(rawResults) ? rawResults : [];

  const filteredStudents = students.filter((s: any) => {
    if (!studentSearch) return true;
    const name = `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.toLowerCase();
    const admission = (s.admissionNumber || '').toLowerCase();
    const q = studentSearch.toLowerCase();
    return name.includes(q) || admission.includes(q);
  });

  const groupedBySession = results.reduce((acc: any, r: any) => {
    const key = `${r.session || 'Unknown'}-${r.term || 'Unknown'}`;
    if (!acc[key]) acc[key] = { session: r.session || 'Unknown', term: r.term || 'Unknown', subjects: [] };
    acc[key].subjects.push(r);
    return acc;
  }, {} as Record<string, { session: string; term: string; subjects: any[] }>);

  const sessions = Object.values(groupedBySession) as { session: string; term: string; subjects: any[] }[];

  const totalSessions = sessions.length;
  const totalSubjects = results.length;
  const totalTerms = [...new Set(results.map((r: any) => r.term))].length;

  const selectedStudentData = students.find((s: any) => s.id === selectedStudent);

  const getGrade = (score: number): { grade: string; remark: string } => {
    if (score >= 75) return { grade: 'A', remark: 'Excellent' };
    if (score >= 65) return { grade: 'B', remark: 'Very Good' };
    if (score >= 55) return { grade: 'C', remark: 'Good' };
    if (score >= 45) return { grade: 'D', remark: 'Fair' };
    return { grade: 'F', remark: 'Needs Improvement' };
  };

  const handlePrint = () => window.print();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Transcript</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transcript</h1>
          <p className="text-muted-foreground">View complete academic history across all terms</p>
        </div>
        {results.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handlePrint}>
              <Download className="h-4 w-4" /> Download
            </Button>
            <Button className="gap-2" onClick={handlePrint}>
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <GraduationCap className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <p className="text-2xl font-bold">{students.length}</p>
            <p className="text-xs text-muted-foreground">Total Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="h-5 w-5 mx-auto mb-1 text-purple-600" />
            <p className="text-2xl font-bold">{totalSubjects}</p>
            <p className="text-xs text-muted-foreground">Subject Records</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-bold">{totalSessions}</p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-5 w-5 mx-auto mb-1 text-orange-600" />
            <p className="text-2xl font-bold">{totalTerms}</p>
            <p className="text-xs text-muted-foreground">Terms</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Select Student</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Student</Label>
            <Select value={selectedStudent} onValueChange={v => setSelectedStudent(v)}>
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder="Search and select a student" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    placeholder="Search by name or admission..."
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
        </CardContent>
      </Card>

      {resultsLoading && (
        <Card>
          <CardContent className="py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            <p className="mt-2 text-muted-foreground">Loading transcript...</p>
          </CardContent>
        </Card>
      )}

      {resultsError && (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
            <p className="mt-2 text-muted-foreground">Failed to load transcript</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refetchResults()}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {selectedStudent && !resultsLoading && !resultsError && results.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="mt-2 text-muted-foreground">No academic records found for this student</p>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && !resultsLoading && (
        <div ref={printRef} className="print-area space-y-6">
          <Card className="print:shadow-none print:border-none">
            <CardHeader className="text-center border-b print:border-b-2">
              <CardTitle className="text-2xl">ACADEMIC TRANSCRIPT</CardTitle>
              <p className="text-muted-foreground">Complete Academic Record</p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <span className="font-medium">Student Name:</span>{' '}
                  {selectedStudentData?.user?.firstName} {selectedStudentData?.user?.lastName}
                </div>
                <div>
                  <span className="font-medium">Admission No:</span>{' '}
                  {selectedStudentData?.admissionNumber}
                </div>
              </div>

              {sessions.map((sess, idx) => {
                const totalScore = sess.subjects.reduce(
                  (sum: number, r: any) => sum + (r.total ?? (r.caScore || 0) + (r.examScore || 0) + (r.testScore || 0)),
                  0,
                );
                const avg = (totalScore / sess.subjects.length).toFixed(1);
                const distinctScores = sess.subjects
                  .map((r: any) => r.total ?? (r.caScore || 0) + (r.examScore || 0) + (r.testScore || 0))
                  .sort((a: number, b: number) => b - a);
                return (
                  <div key={idx} className="mb-8">
                    <h3 className="text-lg font-semibold mb-2">{sess.session} - {sess.term} Term</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead className="text-center">CA/Test</TableHead>
                          <TableHead className="text-center">Exam</TableHead>
                          <TableHead className="text-center">Total</TableHead>
                          <TableHead className="text-center">Grade</TableHead>
                          <TableHead>Remark</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sess.subjects.map((r: any, i: number) => {
                          const total = r.total ?? (r.caScore || 0) + (r.examScore || 0) + (r.testScore || 0);
                          const grade = getGrade(total);
                          return (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{r.subject?.name || r.subjectName || '-'}</TableCell>
                              <TableCell className="text-center">{r.caScore ?? r.testScore ?? '-'}</TableCell>
                              <TableCell className="text-center">{r.examScore ?? '-'}</TableCell>
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
                    <div className="flex justify-end gap-4 mt-2 text-sm">
                      <span><span className="font-medium">Average:</span> {avg}%</span>
                      <span><span className="font-medium">Total:</span> {totalScore}</span>
                      <span><span className="font-medium">Subjects:</span> {sess.subjects.length}</span>
                    </div>
                  </div>
                );
              })}

              <div className="border-t pt-4 mt-6">
                <h3 className="font-semibold mb-2">Cumulative Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div><span className="font-medium">Total Sessions:</span> {sessions.length}</div>
                  <div><span className="font-medium">Total Subjects:</span> {results.length}</div>
                  <div><span className="font-medium">Overall Average:</span>{' '}
                    {(results.reduce((s: number, r: any) => s + (r.total ?? (r.caScore || 0) + (r.examScore || 0) + (r.testScore || 0)), 0) / Math.max(results.length, 1)).toFixed(1)}%
                  </div>
                </div>
              </div>
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
