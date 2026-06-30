'use client';

import { motion } from 'framer-motion';
import { BarChart3, Search, Download, FileText, PieChart, TrendingUp, Users, DollarSign } from 'lucide-react';
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

const reportTypes = [
  { name: 'Academic Performance Report', description: 'Student grades, GPA, and subject performance', icon: FileText, type: 'Academic', lastGenerated: '2024-09-15' },
  { name: 'Fee Collection Report', description: 'Fee payment status, outstanding balances', icon: DollarSign, type: 'Financial', lastGenerated: '2024-09-14' },
  { name: 'Attendance Summary', description: 'Daily/monthly attendance statistics', icon: Users, type: 'Administrative', lastGenerated: '2024-09-15' },
  { name: 'Staff Payroll Report', description: 'Salary disbursement and deductions', icon: TrendingUp, type: 'Financial', lastGenerated: '2024-09-01' },
  { name: 'Class Performance Analysis', description: 'Comparative analysis across classes', icon: BarChart3, type: 'Academic', lastGenerated: '2024-09-10' },
  { name: 'Gender Distribution Report', description: 'Student gender ratio across classes', icon: PieChart, type: 'Demographic', lastGenerated: '2024-08-30' },
];

export default function ReportsPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Reports</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Reports</h1><p className="text-muted-foreground">Generate and view school reports</p></div>
        <Button className="gap-2"><Download className="h-4 w-4" /> Generate Report</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4 text-center"><FileText className="h-5 w-5 mx-auto mb-1 text-blue-600" /><p className="text-2xl font-bold">12</p><p className="text-xs text-muted-foreground">Academic Reports</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><DollarSign className="h-5 w-5 mx-auto mb-1 text-green-600" /><p className="text-2xl font-bold">6</p><p className="text-xs text-muted-foreground">Financial Reports</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Users className="h-5 w-5 mx-auto mb-1 text-purple-600" /><p className="text-2xl font-bold">8</p><p className="text-xs text-muted-foreground">Admin Reports</p></CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((r, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <r.icon className="h-8 w-8 text-primary" />
                <Badge variant="outline">{r.type}</Badge>
              </div>
              <CardTitle className="text-base mt-2">{r.name}</CardTitle>
              <CardDescription className="text-xs">{r.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Last: {r.lastGenerated}</span>
                <Button variant="ghost" size="sm" className="gap-1 h-7"><Download className="h-3 w-3" /> Export</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
