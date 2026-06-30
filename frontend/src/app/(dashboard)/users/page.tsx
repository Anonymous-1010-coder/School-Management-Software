'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, Plus, Users, Clock, CheckCircle, XCircle, Loader2, AlertCircle, UserX, UserCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const { data: usersData, isLoading, isError, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data.data),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/users/${id}`, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast({ title: 'User status updated', variant: 'success' }); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update status', variant: 'destructive' }),
  });

  const users = Array.isArray(usersData) ? usersData : usersData?.users || [];
  const roles = [...new Set(users.map((u: any) => u.role))];

  const filtered = users.filter((u: any) => {
    const matchesSearch = !search || u.firstName?.toLowerCase().includes(search.toLowerCase()) || u.lastName?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()) || `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((u: any) => u.status === 'Active' || u.status === 'active').length;
  const inactiveUsers = users.filter((u: any) => u.status === 'Inactive' || u.status === 'inactive').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="/staff">Staff</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>User Management</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">User Management</h1><p className="text-muted-foreground">Manage system users, roles, and permissions</p></div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4 text-center"><Users className="h-5 w-5 mx-auto mb-1 text-blue-600" /><p className="text-2xl font-bold">{totalUsers}</p><p className="text-xs text-muted-foreground">Total Users</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-600" /><p className="text-2xl font-bold">{activeUsers}</p><p className="text-xs text-muted-foreground">Active</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><XCircle className="h-5 w-5 mx-auto mb-1 text-red-600" /><p className="text-2xl font-bold">{inactiveUsers}</p><p className="text-xs text-muted-foreground">Inactive</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>System Users</CardTitle>
          <div className="flex gap-2 items-center">
            <Select value={roleFilter} onValueChange={v => setRoleFilter(v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Roles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                {roles.map((role: any) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search name or email..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-8"><AlertCircle className="h-8 w-8 text-destructive" /><p className="text-muted-foreground">Failed to load users</p><Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button></div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center gap-3 py-8"><Shield className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No users found</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u: any, i: number) => (
                  <TableRow key={u.id || i}>
                    <TableCell className="font-medium">{u.firstName ? `${u.firstName} ${u.lastName}` : u.name || '-'}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                    <TableCell><Badge variant={u.status === 'Active' || u.status === 'active' ? 'success' : 'secondary'}>{u.status || 'Active'}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{u.lastLogin ? formatDate(u.lastLogin) : '-'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{u.createdAt ? formatDate(u.createdAt) : '-'}</TableCell>
                    <TableCell>
                      {(u.status === 'Active' || u.status === 'active') ? (
                        <Button variant="ghost" size="sm" className="text-destructive gap-1" onClick={() => { if (confirm('Deactivate this user?')) toggleStatusMutation.mutate({ id: u.id, status: 'Inactive' }); }} disabled={toggleStatusMutation.isPending}>
                          {toggleStatusMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserX className="h-3 w-3" />} Deactivate
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-green-600 gap-1" onClick={() => toggleStatusMutation.mutate({ id: u.id, status: 'Active' })} disabled={toggleStatusMutation.isPending}>
                          {toggleStatusMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserCheck className="h-3 w-3" />} Activate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
