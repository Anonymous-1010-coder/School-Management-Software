'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Plus, Phone, Mail, Briefcase, Loader2, AlertCircle, UserRound, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { parentApi } from '@/lib/endpoints';

export default function ParentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', occupation: '' });

  const { data: parentsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['parents'],
    queryFn: () => parentApi.getAll().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => parentApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['parents'] }); toast({ title: 'Parent added', variant: 'success' }); setShowAdd(false); setForm({ firstName: '', lastName: '', email: '', phone: '', occupation: '' }); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to add parent', variant: 'destructive' }),
  });

  const parents = Array.isArray(parentsData) ? parentsData : parentsData?.parents || [];

  const filtered = parents.filter((p: any) =>
    !search || p.firstName?.toLowerCase().includes(search.toLowerCase()) || p.lastName?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = () => {
    if (!form.firstName || !form.lastName) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    createMutation.mutate(form);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="/students">Students</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Parents / Guardians</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parents & Guardians</h1>
          <p className="text-muted-foreground">Manage parent and guardian records</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> Add Parent</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Parents</CardTitle>
          <div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search parents..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-8"><AlertCircle className="h-8 w-8 text-destructive" /><p className="text-muted-foreground">Failed to load parents</p><Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button></div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center gap-3 py-8"><UserRound className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No parents found</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Occupation</TableHead>
                  <TableHead>Children</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.firstName} {p.lastName}</TableCell>
                    <TableCell>{p.email || '-'}</TableCell>
                    <TableCell>{p.phone || '-'}</TableCell>
                    <TableCell>{p.occupation || '-'}</TableCell>
                    <TableCell><Badge variant="secondary">{p._count?.students ?? p.students?.length ?? 0}</Badge></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon"><Phone className="h-4 w-4 text-blue-600" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Parent</DialogTitle>
            <DialogDescription>Fill in the parent's details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>First Name *</Label><Input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="John" /></div>
              <div className="space-y-2"><Label>Last Name *</Label><Input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Doe" /></div>
            </div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="parent@school.com" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+234-XXX-XXX-XXXX" /></div>
            <div className="space-y-2"><Label>Occupation</Label><Input value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} placeholder="Engineer" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setForm({ firstName: '', lastName: '', email: '', phone: '', occupation: '' }); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>{createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
