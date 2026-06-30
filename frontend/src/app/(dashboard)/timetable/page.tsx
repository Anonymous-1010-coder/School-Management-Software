'use client';

import { motion } from 'framer-motion';
import { CalendarRange, Search, Plus, MoreHorizontal, Clock, User, MapPin } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const periods = [
  { time: '08:00 - 08:45', period: 1 },
  { time: '08:45 - 09:30', period: 2 },
  { time: '09:30 - 10:15', period: 3 },
  { time: '10:30 - 11:15', period: 4 },
  { time: '11:15 - 12:00', period: 5 },
  { time: '12:45 - 13:30', period: 6 },
  { time: '13:30 - 14:15', period: 7 },
];

const timetable: Record<string, { subject: string; teacher: string; room: string }[]> = {
  Monday: [
    { subject: 'Mathematics', teacher: 'R. Clark', room: '101' },
    { subject: 'English', teacher: 'E. Martinez', room: '102' },
    { subject: 'Basic Science', teacher: 'D. Thompson', room: '103' },
    { subject: 'Break', teacher: '', room: '' },
    { subject: 'Social Studies', teacher: 'TBD', room: '104' },
    { subject: 'Civic Ed.', teacher: 'TBD', room: '105' },
    { subject: 'Computer', teacher: 'TBD', room: 'Computer Lab' },
  ],
  Tuesday: [
    { subject: 'English', teacher: 'E. Martinez', room: '102' },
    { subject: 'Mathematics', teacher: 'R. Clark', room: '101' },
    { subject: 'Civic Ed.', teacher: 'TBD', room: '105' },
    { subject: 'Break', teacher: '', room: '' },
    { subject: 'Basic Science', teacher: 'D. Thompson', room: '103' },
    { subject: 'Social Studies', teacher: 'TBD', room: '104' },
    { subject: 'PHE', teacher: 'TBD', room: 'Field' },
  ],
};

export default function TimetablePage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="/academic">Academic</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Timetable</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Timetable</h1><p className="text-muted-foreground">Class and teacher schedules</p></div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Edit Timetable</Button>
      </div>

      <Tabs defaultValue="JSS 1A">
        <TabsList>
          <TabsTrigger value="JSS 1A">JSS 1A</TabsTrigger>
          <TabsTrigger value="JSS 1B">JSS 1B</TabsTrigger>
          <TabsTrigger value="SS 1A">SS 1A</TabsTrigger>
        </TabsList>
        <TabsContent value="JSS 1A" className="mt-4">
          <Card>
            <CardContent className="p-0 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Time</TableHead>
                    {days.map((d) => (<TableHead key={d}>{d}</TableHead>))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((p) => (
                    <TableRow key={p.period}>
                      <TableCell className="font-medium text-xs">{p.time}</TableCell>
                      {days.map((d) => {
                        const entry = (timetable[d] || [])[p.period - 1] || { subject: '-', teacher: '', room: '' };
                        return (
                          <TableCell key={d} className={entry.subject === 'Break' ? 'bg-muted/50 text-center text-muted-foreground' : ''}>
                            {entry.subject === 'Break' ? 'BREAK' : (
                              <div className="text-xs">
                                <p className="font-medium">{entry.subject}</p>
                                {entry.teacher && <p className="text-muted-foreground">{entry.teacher}</p>}
                                {entry.room && <p className="text-muted-foreground">{entry.room}</p>}
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
