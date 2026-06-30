'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, Loader2, AlertCircle, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { homeworkApi, subjectApi, classApi } from '@/lib/endpoints';
import { useAuth } from '@/contexts/auth-context';
import { formatDate } from '@/lib/utils';

export default function AssignmentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('pending');
  const [submitId, setSubmitId] = useState<string | null>(null);
  const [submission, setSubmission] = useState('');

  const { data: hwData, isLoading, isError, refetch } = useQuery({
    queryKey: ['assignments', search],
    queryFn: () => homeworkApi.getAll({ search, limit: 50 }).then(r => r.data.data),
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectApi.getAll().then(r => r.data.data),
  });

  const submitMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => homeworkApi.submit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast({ title: 'Assignment submitted successfully', variant: 'success' });
      setSubmitId(null);
      setSubmission('');
    },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to submit', variant: 'destructive' }),
  });

  const list = hwData?.homeworks || hwData?.homework || hwData || [];
  const isStudent = user?.role === 'STUDENT';

  const pendingAssignments = isStudent
    ? list.filter((hw: any) => {
        if (!hw.dueDate) return true;
        return new Date(hw.dueDate) >= new Date();
      })
    : list;

  const pastAssignments = isStudent
    ? list.filter((hw: any) => {
        if (!hw.dueDate) return false;
        return new Date(hw.dueDate) < new Date();
      })
    : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Assignments</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div><h1 className="text-3xl font-bold tracking-tight">Assignments</h1><p className="text-muted-foreground">View and submit your assignments</p></div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending"><Clock className="h-4 w-4 mr-2" /> Pending</TabsTrigger>
          <TabsTrigger value="submitted"><CheckCircle className="h-4 w-4 mr-2" /> Submitted</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pending Assignments</CardTitle>
              <div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
              ) : isError ? (
                <div className="flex flex-col items-center gap-3 py-8"><AlertCircle className="h-8 w-8 text-destructive" /><p className="text-muted-foreground">Failed to load assignments</p><Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button></div>
              ) : !pendingAssignments.length ? (
                <div className="flex flex-col items-center gap-3 py-8"><CheckCircle className="h-8 w-8 text-green-500" /><p className="text-muted-foreground">No pending assignments</p></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingAssignments.map((hw: any) => (
                      <TableRow key={hw.id}>
                        <TableCell className="font-medium">{hw.title}</TableCell>
                        <TableCell>{hw.subject?.name || '-'}</TableCell>
                        <TableCell>{hw.dueDate ? formatDate(hw.dueDate) : '-'}</TableCell>
                        <TableCell>
                          {!hw.dueDate ? <Badge variant="secondary">Open</Badge>
                            : new Date(hw.dueDate) < new Date() ? <Badge variant="destructive">Overdue</Badge>
                            : <Badge variant="success">Active</Badge>}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => { setSubmitId(hw.id); setSubmission(''); }}>Submit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="submitted">
          <Card>
            <CardHeader><CardTitle>Submitted Assignments</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-3 py-8"><FileText className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">View your submitted homework here</p></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!submitId} onOpenChange={o => { if (!o) setSubmitId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Assignment</DialogTitle><DialogDescription>Submit your work for this assignment</DialogDescription></DialogHeader>
          <div className="space-y-2"><Label>Submission Details</Label><textarea className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={submission} onChange={e => setSubmission(e.target.value)} placeholder="Enter your submission text or notes..." /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitId(null)}>Cancel</Button>
            <Button onClick={() => submitId && submitMutation.mutate({ id: submitId, data: { submission } })} disabled={!submission.trim() || submitMutation.isPending}>{submitMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : 'Submit'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
