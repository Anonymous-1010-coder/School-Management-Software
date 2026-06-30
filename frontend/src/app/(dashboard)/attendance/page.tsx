'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, Search, Plus, Clock, UserCheck, UserX, Loader2, AlertCircle, CalendarDays } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { attendanceApi, classApi } from '@/lib/endpoints';

const statusColors: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  PRESENT: 'success',
  LATE: 'warning',
  ABSENT: 'destructive',
  EXCUSED: 'secondary',
};

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [classFilter, setClassFilter] = useState('ALL');
  const [tab, setTab] = useState('students');

  const { data: attendanceData, isLoading, isError, refetch } = useQuery({
    queryKey: ['attendance', date, classFilter, tab],
    queryFn: () => attendanceApi.getAll({ date, classId: classFilter === 'ALL' ? undefined : classFilter, type: tab === 'students' ? 'student' : 'staff' }).then(r => r.data.data),
  });

  const { data: statsData } = useQuery({
    queryKey: ['attendance-stats', date],
    queryFn: () => attendanceApi.getStats({ date }).then(r => r.data.data),
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classApi.getAll().then(r => r.data.data),
  });

  const records = Array.isArray(attendanceData) ? attendanceData : attendanceData?.records || [];
  const stats = statsData || {};
  const classes = Array.isArray(classesData) ? classesData : classesData?.classes || [];

  const present = records.filter((r: any) => r.status === 'PRESENT').length;
  const absent = records.filter((r: any) => r.status === 'ABSENT').length;
  const late = records.filter((r: any) => r.status === 'LATE').length;
  const excused = records.filter((r: any) => r.status === 'EXCUSED').length;

  const filtered = records.filter((r: any) =>
    !search || r.student?.firstName?.toLowerCase().includes(search.toLowerCase()) || r.student?.lastName?.toLowerCase().includes(search.toLowerCase()) || r.staff?.firstName?.toLowerCase().includes(search.toLowerCase()) || r.staff?.lastName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Attendance</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Attendance</h1><p className="text-muted-foreground">Track daily student and staff attendance</p></div>
        <div className="flex gap-2">
          <div className="relative"><CalendarDays className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="date" className="pl-8 w-44" value={date} onChange={e => setDate(e.target.value)} /></div>
          <Button className="gap-2"><Plus className="h-4 w-4" /> Mark Attendance</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4 text-center"><UserCheck className="h-5 w-5 mx-auto mb-1 text-green-600" /><p className="text-2xl font-bold">{stats.present ?? stats.rate ?? present}</p><p className="text-xs text-muted-foreground">Present</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><UserX className="h-5 w-5 mx-auto mb-1 text-red-600" /><p className="text-2xl font-bold">{stats.absent ?? absent}</p><p className="text-xs text-muted-foreground">Absent</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Clock className="h-5 w-5 mx-auto mb-1 text-orange-600" /><p className="text-2xl font-bold">{stats.late ?? late}</p><p className="text-xs text-muted-foreground">Late</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><CalendarCheck className="h-5 w-5 mx-auto mb-1 text-blue-600" /><p className="text-2xl font-bold">{stats.excused ?? excused}</p><p className="text-xs text-muted-foreground">Excused</p></CardContent></Card>
      </div>

      <Tabs defaultValue="students" onValueChange={setTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="students">Student Attendance</TabsTrigger>
            <TabsTrigger value="staff">Staff Attendance</TabsTrigger>
          </TabsList>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Filter by class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Classes</SelectItem>
              {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value={tab} className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Attendance for {date}</CardTitle>
              <div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
              ) : isError ? (
                <div className="flex flex-col items-center gap-3 py-8"><AlertCircle className="h-8 w-8 text-destructive" /><p className="text-muted-foreground">Failed to load attendance</p><Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button></div>
              ) : !filtered.length ? (
                <div className="flex flex-col items-center gap-3 py-8"><CalendarCheck className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No attendance records for this date</p></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{tab === 'students' ? 'Student' : 'Staff'} Name</TableHead>
                      {tab === 'students' && <TableHead>Class</TableHead>}
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Marked By</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.student ? `${r.student.firstName} ${r.student.lastName}` : r.staff ? `${r.staff.firstName} ${r.staff.lastName}` : '-'}</TableCell>
                        {tab === 'students' && <TableCell>{r.student?.class?.name || r.student?.arm?.name || '-'}</TableCell>}
                        <TableCell>{r.date ? new Date(r.date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>
                          <Badge variant={statusColors[r.status] || 'secondary'}>{r.status}</Badge>
                        </TableCell>
                        <TableCell>{r.time || r.checkIn || '-'}</TableCell>
                        <TableCell>{r.markedBy?.firstName ? `${r.markedBy.firstName} ${r.markedBy.lastName}` : r.markedByName || '-'}</TableCell>
                        <TableCell><Button variant="ghost" size="icon"><Search className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
