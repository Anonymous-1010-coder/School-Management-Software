'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi, studentApi, classApi, examApi, attendanceApi, financeApi } from '@/lib/endpoints';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, GraduationCap, BookOpen, CalendarCheck, Wallet, ClipboardCheck, TrendingUp, Activity } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const attendanceChartData = Array.from({ length: 7 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (6 - i));
  return {
    day: date.toLocaleDateString('en-US', { weekday: 'short' }),
    present: Math.floor(Math.random() * 20) + 75,
    absent: Math.floor(Math.random() * 10) + 2,
    late: Math.floor(Math.random() * 6) + 1,
  };
});

function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: dashData, isLoading: dashLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
  });

  const { data: studentData } = useQuery({
    queryKey: ['student-stats'],
    queryFn: () => studentApi.getStats(),
  });

  const { data: classData } = useQuery({
    queryKey: ['class-stats'],
    queryFn: () => classApi.getStats(),
  });

  const { data: examData } = useQuery({
    queryKey: ['exam-stats'],
    queryFn: () => examApi.getStats(),
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['attendance-stats'],
    queryFn: () => attendanceApi.getStats(),
  });

  const { data: financeData, isLoading: financeLoading } = useQuery({
    queryKey: ['finance-stats'],
    queryFn: () => financeApi.getStats(),
  });

  const totalStudents = dashData?.data?.totalStudents ?? studentData?.data?.total ?? 0;
  const totalStaff = dashData?.data?.totalStaff ?? 0;
  const totalClasses = dashData?.data?.totalClasses ?? classData?.data?.total ?? 0;
  const attendanceRate = dashData?.data?.attendanceRate ?? attendanceData?.data?.rate ?? 0;
  const revenue = dashData?.data?.totalRevenue ?? financeData?.data?.totalRevenue ?? 0;
  const activeExams = dashData?.data?.activeExams ?? examData?.data?.active ?? 0;
  const recentPayments = financeData?.data?.recentPayments ?? [];
  const activities = dashData?.data?.recentActivities ?? [];

  if (dashLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-72 mt-1" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card><CardContent className="p-6"><Skeleton className="h-[300px] w-full" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-[300px] w-full" /></CardContent></Card>
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-[250px] w-full" /></CardContent></Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-destructive text-lg">Failed to load dashboard data</p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const statsCards = [
    { title: 'Total Students', value: totalStudents.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-950' },
    { title: 'Total Staff', value: totalStaff.toLocaleString(), icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-950' },
    { title: 'Total Classes', value: totalClasses.toLocaleString(), icon: BookOpen, color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-950' },
    { title: 'Attendance Rate', value: `${attendanceRate}%`, icon: CalendarCheck, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-950' },
    { title: 'Revenue', value: formatCurrency(revenue), icon: Wallet, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-950' },
    { title: 'Active Exams', value: activeExams.toLocaleString(), icon: ClipboardCheck, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-950' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s your school overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`rounded-lg p-2.5 ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attendance (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="present" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No recent activities</p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity: any, i: number) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`h-2 w-2 rounded-full ${
                      activity.type === 'success' ? 'bg-emerald-500' :
                      activity.type === 'info' ? 'bg-blue-500' :
                      activity.type === 'warning' ? 'bg-amber-500' : 'bg-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.action || activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.user || activity.performedBy || ''}
                        {(activity.time || activity.createdAt) ? ` \u2022 ${activity.time ? activity.time : formatDate(activity.createdAt)}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Recent Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {financeLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No recent payments</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.map((payment: any, i: number) => (
                  <TableRow key={payment._id || i}>
                    <TableCell className="font-medium">
                      {payment.student?.name || payment.studentName || payment.student || '-'}
                    </TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{formatDate(payment.date || payment.createdAt || payment.paymentDate)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        (payment.status === 'paid' || payment.status === 'Paid' || payment.status === 'completed') ? 'success' :
                        (payment.status === 'partial' || payment.status === 'Partial') ? 'warning' : 'destructive'
                      }>
                        {payment.status || 'Unknown'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
