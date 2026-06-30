'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Search, Plus, MoreHorizontal, Bed, DoorOpen, Users, Loader2, AlertCircle, Home, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { hostelApi, studentApi } from '@/lib/endpoints';

export default function HostelPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAllocate, setShowAllocate] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [allocForm, setAllocForm] = useState({ studentId: '', hostelId: '', room: '', bed: '' });
  const [hostelForm, setHostelForm] = useState({ name: '', gender: '', capacity: '', rooms: '' });

  const { data: hostelData, isLoading, isError, refetch } = useQuery({
    queryKey: ['hostels'],
    queryFn: () => hostelApi.getAll().then(r => r.data.data),
  });

  const { data: statsData } = useQuery({
    queryKey: ['hostel-stats'],
    queryFn: () => hostelApi.getStats().then(r => r.data.data),
  });

  const { data: studentsData } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentApi.getAll().then(r => r.data.data),
  });

  const allocateMutation = useMutation({
    mutationFn: (data: any) => hostelApi.allocate(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hostels'] }); queryClient.invalidateQueries({ queryKey: ['hostel-stats'] }); toast({ title: 'Room allocated', variant: 'success' }); setShowAllocate(false); setAllocForm({ studentId: '', hostelId: '', room: '', bed: '' }); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Allocation failed', variant: 'destructive' }),
  });

  const deallocateMutation = useMutation({
    mutationFn: (id: string) => hostelApi.deallocate(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hostels'] }); queryClient.invalidateQueries({ queryKey: ['hostel-stats'] }); toast({ title: 'Deallocated', variant: 'success' }); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Deallocation failed', variant: 'destructive' }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => hostelApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hostels'] }); queryClient.invalidateQueries({ queryKey: ['hostel-stats'] }); toast({ title: 'Hostel added', variant: 'success' }); setShowAdd(false); setHostelForm({ name: '', gender: '', capacity: '', rooms: '' }); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to add hostel', variant: 'destructive' }),
  });

  const hostels = Array.isArray(hostelData) ? hostelData : hostelData?.hostels || [];
  const students = Array.isArray(studentsData) ? studentsData : studentsData?.students || [];
  const stats = statsData || {};

  const totalCapacity = stats?.totalCapacity ?? stats?.capacity ?? hostels.reduce((sum: number, h: any) => sum + (h.capacity || h.capacity || 0), 0);
  const totalAllocated = stats?.totalAllocated ?? stats?.allocated ?? hostels.reduce((sum: number, h: any) => sum + (h.occupied || h.allocated || 0), 0);
  const totalAvailable = totalCapacity - totalAllocated;

  const allocations = hostels.flatMap((h: any) =>
    (h.allocations || h.occupants || []).map((a: any) => ({
      ...a,
      hostelName: h.name,
    }))
  );

  const filtered = hostels.filter((h: any) =>
    !search || h.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Hostel</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Hostel Management</h1><p className="text-muted-foreground">Manage hostels, rooms, and bed allocations</p></div>
        <div className="flex gap-2">
          <Button className="gap-2" onClick={() => setShowAllocate(true)}><Plus className="h-4 w-4" /> Allocate Room</Button>
          <Button variant="outline" className="gap-2" onClick={() => setShowAdd(true)}><Building2 className="h-4 w-4" /> Add Hostel</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4 text-center"><DoorOpen className="h-5 w-5 mx-auto mb-1 text-blue-600" /><p className="text-2xl font-bold">{totalCapacity}</p><p className="text-xs text-muted-foreground">Total Capacity</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Users className="h-5 w-5 mx-auto mb-1 text-green-600" /><p className="text-2xl font-bold">{totalAllocated}</p><p className="text-xs text-muted-foreground">Allocated</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Bed className="h-5 w-5 mx-auto mb-1 text-purple-600" /><p className="text-2xl font-bold">{totalAvailable}</p><p className="text-xs text-muted-foreground">Available</p></CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Hostels</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-3 py-8"><AlertCircle className="h-8 w-8 text-destructive" /><p className="text-muted-foreground">Failed to load hostels</p><Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button></div>
            ) : !filtered.length ? (
              <div className="flex flex-col items-center gap-3 py-8"><Home className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No hostels found</p></div>
            ) : (
              <div className="space-y-3">
                {filtered.map((h: any) => (
                  <Card key={h.id}>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">{h.name}</CardTitle><CardDescription>{h.gender || h.gender || '-'} Hostel</CardDescription></CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm mb-2"><span>Occupancy</span><span className="font-medium">{(h.occupied ?? h.allocated ?? 0)}/{h.capacity ?? 0}</span></div>
                      <div className="w-full bg-muted rounded-full h-2 mb-3"><div className="bg-primary h-2 rounded-full" style={{ width: `${((h.occupied ?? h.allocated ?? 0) / (h.capacity || 1)) * 100}%` }}></div></div>
                      <div className="grid grid-cols-2 text-sm"><span className="text-muted-foreground">Rooms:</span><span className="text-right font-medium">{h.rooms ?? h.roomCount ?? 0}</span></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Allocations</CardTitle>
            <div className="relative w-48"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-3 py-8"><AlertCircle className="h-8 w-8 text-destructive" /><p className="text-muted-foreground">Failed to load allocations</p><Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button></div>
            ) : !allocations.length ? (
              <div className="flex flex-col items-center gap-3 py-8"><Users className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No allocations yet</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Hostel</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Bed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.map((a: any, i: number) => (
                    <TableRow key={a.id || i}>
                      <TableCell className="font-medium">{a.student?.firstName ? `${a.student.firstName} ${a.student.lastName}` : a.student?.name || a.studentName || '-'}</TableCell>
                      <TableCell>{a.hostelName || a.hostel?.name || '-'}</TableCell>
                      <TableCell>{a.room || a.roomNumber || '-'}</TableCell>
                      <TableCell>{a.bed || a.bedNumber || '-'}</TableCell>
                      <TableCell><Badge variant="success">{a.status || 'Active'}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm('Deallocate this student?')) deallocateMutation.mutate(a.id); }}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAllocate} onOpenChange={setShowAllocate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Allocate Room</DialogTitle>
            <DialogDescription>Select student and assign hostel room</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Student</Label>
              <Select value={allocForm.studentId} onValueChange={v => setAllocForm({ ...allocForm, studentId: v })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.firstName ? `${s.firstName} ${s.lastName}` : s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Hostel</Label>
              <Select value={allocForm.hostelId} onValueChange={v => setAllocForm({ ...allocForm, hostelId: v })}>
                <SelectTrigger><SelectValue placeholder="Select hostel" /></SelectTrigger>
                <SelectContent>
                  {hostels.map((h: any) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Room</Label><Input value={allocForm.room} onChange={e => setAllocForm({ ...allocForm, room: e.target.value })} placeholder="e.g., B101" /></div>
            <div className="space-y-2"><Label>Bed</Label><Input value={allocForm.bed} onChange={e => setAllocForm({ ...allocForm, bed: e.target.value })} placeholder="e.g., B101-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAllocate(false); setAllocForm({ studentId: '', hostelId: '', room: '', bed: '' }); }}>Cancel</Button>
            <Button onClick={() => allocateMutation.mutate(allocForm)} disabled={allocateMutation.isPending || !allocForm.studentId || !allocForm.hostelId}>
              {allocateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Allocating...</> : 'Allocate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Hostel</DialogTitle>
            <DialogDescription>Enter hostel details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Name</Label><Input value={hostelForm.name} onChange={e => setHostelForm({ ...hostelForm, name: e.target.value })} placeholder="e.g., Boys Hostel" /></div>
            <div className="space-y-2"><Label>Gender</Label>
              <Select value={hostelForm.gender} onValueChange={v => setHostelForm({ ...hostelForm, gender: v })}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Capacity</Label><Input type="number" value={hostelForm.capacity} onChange={e => setHostelForm({ ...hostelForm, capacity: e.target.value })} placeholder="e.g., 100" /></div>
            <div className="space-y-2"><Label>Rooms</Label><Input type="number" value={hostelForm.rooms} onChange={e => setHostelForm({ ...hostelForm, rooms: e.target.value })} placeholder="e.g., 25" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setHostelForm({ name: '', gender: '', capacity: '', rooms: '' }); }}>Cancel</Button>
            <Button onClick={() => createMutation.mutate({ ...hostelForm, capacity: hostelForm.capacity ? parseInt(hostelForm.capacity) : undefined, rooms: hostelForm.rooms ? parseInt(hostelForm.rooms) : undefined })} disabled={createMutation.isPending || !hostelForm.name}>
              {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
