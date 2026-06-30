'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bus, Search, Plus, Loader2, AlertCircle, Route, Users, Fuel, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { transportApi, studentApi } from '@/lib/endpoints';
import { formatCurrency } from '@/lib/utils';

export default function TransportPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showAllocate, setShowAllocate] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ registration: '', model: '', capacity: '', driver: '', route: '' });
  const [allocForm, setAllocForm] = useState({ studentId: '', vehicleId: '', pickup: '', dropoff: '', fee: '' });

  const { data: transportData, isLoading, isError, refetch } = useQuery({
    queryKey: ['transport'],
    queryFn: () => transportApi.getAll().then(r => r.data.data),
  });

  const { data: studentsData } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentApi.getAll().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => transportApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['transport'] }); toast({ title: 'Vehicle added', variant: 'success' }); setShowAdd(false); setVehicleForm({ registration: '', model: '', capacity: '', driver: '', route: '' }); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to add vehicle', variant: 'destructive' }),
  });

  const allocateMutation = useMutation({
    mutationFn: (data: any) => transportApi.allocate(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['transport'] }); toast({ title: 'Allocated', variant: 'success' }); setShowAllocate(false); setAllocForm({ studentId: '', vehicleId: '', pickup: '', dropoff: '', fee: '' }); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Allocation failed', variant: 'destructive' }),
  });

  const deallocateMutation = useMutation({
    mutationFn: (id: string) => transportApi.deallocate(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['transport'] }); toast({ title: 'Deallocated', variant: 'success' }); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Deallocation failed', variant: 'destructive' }),
  });

  const data = Array.isArray(transportData) ? transportData : transportData?.vehicles || transportData?.data || [];
  const students = Array.isArray(studentsData) ? studentsData : studentsData?.students || [];
  const vehicles = data;
  const allocations = data.flatMap((v: any) =>
    (v.allocations || []).map((a: any) => ({ ...a, vehicleReg: v.registration || v.reg, vehicleModel: v.model }))
  );

  const filtered = vehicles.filter((v: any) =>
    !search || v.registration?.toLowerCase().includes(search.toLowerCase()) || v.model?.toLowerCase().includes(search.toLowerCase()) || v.driver?.toLowerCase().includes(search.toLowerCase()) || v.route?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Transport</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Transport</h1><p className="text-muted-foreground">Manage school vehicles, routes, and student transport</p></div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowAllocate(true)}><Users className="h-4 w-4" /> Allocate</Button>
          <Button className="gap-2" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> Add Vehicle</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Vehicles</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-3 py-8"><AlertCircle className="h-8 w-8 text-destructive" /><p className="text-muted-foreground">Failed to load vehicles</p><Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button></div>
            ) : !filtered.length ? (
              <div className="flex flex-col items-center gap-3 py-8"><Bus className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No vehicles found</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Registration</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((v: any, i: number) => (
                    <TableRow key={v.id || i}>
                      <TableCell className="font-medium">{v.registration || v.reg || '-'}</TableCell>
                      <TableCell>{v.model || '-'}</TableCell>
                      <TableCell>{v.capacity ?? '-'}</TableCell>
                      <TableCell>{v.driver || '-'}</TableCell>
                      <TableCell>{v.route || '-'}</TableCell>
                      <TableCell><Badge variant={v.status === 'Active' || v.status === 'active' ? 'success' : 'warning'}>{v.status || 'Active'}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
              <div className="flex flex-col items-center gap-3 py-8"><Route className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No allocations yet</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Pickup</TableHead>
                    <TableHead>Dropoff</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.map((a: any, i: number) => (
                    <TableRow key={a.id || i}>
                      <TableCell className="font-medium">{a.student?.firstName ? `${a.student.firstName} ${a.student.lastName}` : a.student?.name || a.studentName || '-'}</TableCell>
                      <TableCell>{a.vehicleReg || a.vehicle?.registration || a.vehicle?.reg || '-'}</TableCell>
                      <TableCell>{a.pickup || a.pickupPoint || '-'}</TableCell>
                      <TableCell>{a.dropoff || a.dropoffPoint || '-'}</TableCell>
                      <TableCell>{a.fee ? formatCurrency(a.fee) : '-'}</TableCell>
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

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Vehicle</DialogTitle>
            <DialogDescription>Enter vehicle details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Registration</Label><Input value={vehicleForm.registration} onChange={e => setVehicleForm({ ...vehicleForm, registration: e.target.value })} placeholder="e.g., LAG-123-XYZ" /></div>
            <div className="space-y-2"><Label>Model</Label><Input value={vehicleForm.model} onChange={e => setVehicleForm({ ...vehicleForm, model: e.target.value })} placeholder="e.g., Toyota Hiace" /></div>
            <div className="space-y-2"><Label>Capacity</Label><Input type="number" value={vehicleForm.capacity} onChange={e => setVehicleForm({ ...vehicleForm, capacity: e.target.value })} placeholder="e.g., 18" /></div>
            <div className="space-y-2"><Label>Driver</Label><Input value={vehicleForm.driver} onChange={e => setVehicleForm({ ...vehicleForm, driver: e.target.value })} placeholder="Driver name" /></div>
            <div className="space-y-2"><Label>Route</Label><Input value={vehicleForm.route} onChange={e => setVehicleForm({ ...vehicleForm, route: e.target.value })} placeholder="e.g., Lekki Phase 1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setVehicleForm({ registration: '', model: '', capacity: '', driver: '', route: '' }); }}>Cancel</Button>
            <Button onClick={() => createMutation.mutate({ ...vehicleForm, capacity: vehicleForm.capacity ? parseInt(vehicleForm.capacity) : undefined })} disabled={createMutation.isPending || !vehicleForm.registration}>
              {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAllocate} onOpenChange={setShowAllocate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Allocate Transport</DialogTitle>
            <DialogDescription>Assign student to a vehicle</DialogDescription>
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
            <div className="space-y-2"><Label>Vehicle</Label>
              <Select value={allocForm.vehicleId} onValueChange={v => setAllocForm({ ...allocForm, vehicleId: v })}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.registration || v.reg} - {v.model}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Pickup Point</Label><Input value={allocForm.pickup} onChange={e => setAllocForm({ ...allocForm, pickup: e.target.value })} placeholder="e.g., Lekki Gate" /></div>
            <div className="space-y-2"><Label>Dropoff Point</Label><Input value={allocForm.dropoff} onChange={e => setAllocForm({ ...allocForm, dropoff: e.target.value })} placeholder="e.g., School" /></div>
            <div className="space-y-2"><Label>Fee</Label><Input type="number" value={allocForm.fee} onChange={e => setAllocForm({ ...allocForm, fee: e.target.value })} placeholder="e.g., 15000" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAllocate(false); setAllocForm({ studentId: '', vehicleId: '', pickup: '', dropoff: '', fee: '' }); }}>Cancel</Button>
            <Button onClick={() => allocateMutation.mutate({ ...allocForm, fee: allocForm.fee ? parseInt(allocForm.fee) : undefined })} disabled={allocateMutation.isPending || !allocForm.studentId || !allocForm.vehicleId}>
              {allocateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Allocating...</> : 'Allocate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
