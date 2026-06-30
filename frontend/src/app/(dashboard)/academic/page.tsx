'use client';

import { motion } from 'framer-motion';
import { BookOpen, Search, Plus, MoreHorizontal, Layers, BookType, ClipboardCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const stats = [
  { label: 'Classes', value: '18', icon: Layers, color: 'text-blue-600' },
  { label: 'Subjects', value: '24', icon: BookType, color: 'text-green-600' },
  { label: 'Teachers', value: '52', icon: Users, color: 'text-purple-600' },
  { label: 'Active Exams', value: '6', icon: ClipboardCheck, color: 'text-orange-600' },
];

const recentExams = [
  { title: 'First Term Examination', class: 'JSS 1', subject: 'Mathematics', date: '2024-12-01', type: 'End Term', status: 'Upcoming' },
  { title: 'Mid Term Test', class: 'SS 1', subject: 'English', date: '2024-10-15', type: 'Mid Term', status: 'Completed' },
  { title: 'CA Test 2', class: 'JSS 2', subject: 'Basic Science', date: '2024-11-01', type: 'CA Test', status: 'Ongoing' },
  { title: 'Mock Examination', class: 'SS 3', subject: 'All Subjects', date: '2025-01-10', type: 'Mock', status: 'Upcoming' },
];

export default function AcademicPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Academic</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Academic</h1>
        <p className="text-muted-foreground">Manage classes, subjects, examinations, and academic records</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="rounded-lg bg-muted p-2.5"><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="justify-start gap-2 h-auto py-3"><Layers className="h-4 w-4" /> Manage Classes</Button>
            <Button variant="outline" className="justify-start gap-2 h-auto py-3"><BookType className="h-4 w-4" /> Manage Subjects</Button>
            <Button variant="outline" className="justify-start gap-2 h-auto py-3"><ClipboardCheck className="h-4 w-4" /> Create Exam</Button>
            <Button variant="outline" className="justify-start gap-2 h-auto py-3"><BookOpen className="h-4 w-4" /> Timetable</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Current Session</CardTitle><CardDescription>2024/2025 Academic Year - First Term</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm"><span>Term Progress</span><span className="font-medium">65%</span></div>
            <div className="w-full bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full" style={{ width: '65%' }}></div></div>
            <div className="grid grid-cols-2 gap-2 text-sm pt-2">
              <div><span className="text-muted-foreground">Weeks Completed:</span><span className="float-right font-medium">8</span></div>
              <div><span className="text-muted-foreground">Total Weeks:</span><span className="float-right font-medium">12</span></div>
              <div><span className="text-muted-foreground">Next Holiday:</span><span className="float-right font-medium">Dec 20</span></div>
              <div><span className="text-muted-foreground">Resumption:</span><span className="float-right font-medium">Jan 8</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Examinations</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam Title</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentExams.map((e, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{e.title}</TableCell>
                  <TableCell>{e.class}</TableCell>
                  <TableCell>{e.subject}</TableCell>
                  <TableCell>{e.date}</TableCell>
                  <TableCell><Badge variant="outline">{e.type}</Badge></TableCell>
                  <TableCell><Badge variant={e.status === 'Completed' ? 'success' : e.status === 'Ongoing' ? 'warning' : 'secondary'}>{e.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
