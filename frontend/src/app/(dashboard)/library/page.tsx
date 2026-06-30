'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Library, Search, Plus, BookOpen, BookMarked, Barcode, Loader2, AlertCircle, BookCopy, ArrowLeftRight } from 'lucide-react';
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
import { libraryApi } from '@/lib/endpoints';

export default function LibraryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', author: '', isbn: '', category: '', total: '', available: '' });

  const { data: booksData, isLoading, isError, refetch } = useQuery({
    queryKey: ['library'],
    queryFn: () => libraryApi.getAll().then(r => r.data.data),
  });

  const { data: statsData } = useQuery({
    queryKey: ['library-stats'],
    queryFn: () => libraryApi.getStats().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => libraryApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['library'] }); queryClient.invalidateQueries({ queryKey: ['library-stats'] }); toast({ title: 'Book added', variant: 'success' }); setShowAdd(false); setForm({ title: '', author: '', isbn: '', category: '', total: '', available: '' }); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to add book', variant: 'destructive' }),
  });

  const borrowMutation = useMutation({
    mutationFn: (data: any) => libraryApi.borrow(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['library'] }); queryClient.invalidateQueries({ queryKey: ['library-stats'] }); toast({ title: 'Book borrowed', variant: 'success' }); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to borrow', variant: 'destructive' }),
  });

  const returnMutation = useMutation({
    mutationFn: (id: string) => libraryApi.return(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['library'] }); queryClient.invalidateQueries({ queryKey: ['library-stats'] }); toast({ title: 'Book returned', variant: 'success' }); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to return', variant: 'destructive' }),
  });

  const books = Array.isArray(booksData) ? booksData : booksData?.books || [];
  const stats = statsData || {};

  const totalBooks = stats.totalBooks ?? books.length;
  const availableCount = stats.availableBooks ?? books.filter((b: any) => b.status === 'Available' || (b.available || 0) > 0).length;
  const borrowedCount = stats.borrowedBooks ?? books.filter((b: any) => b.status === 'Borrowed' || (b.available || 0) <= 0).length;

  const filtered = books.filter((b: any) =>
    !search || b.title?.toLowerCase().includes(search.toLowerCase()) || b.author?.toLowerCase().includes(search.toLowerCase()) || b.isbn?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = () => {
    if (!form.title || !form.author) { toast({ title: 'Title and author are required', variant: 'destructive' }); return; }
    createMutation.mutate({ ...form, total: parseInt(form.total) || 1, available: parseInt(form.available) || parseInt(form.total) || 1 });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Library</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Library</h1><p className="text-muted-foreground">Manage books, borrowings, and returns</p></div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Barcode className="h-4 w-4" /> Scan Barcode</Button>
          <Button className="gap-2" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> Add Book</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4 text-center"><BookOpen className="h-5 w-5 mx-auto mb-1 text-blue-600" /><p className="text-2xl font-bold">{totalBooks}</p><p className="text-xs text-muted-foreground">Total Books</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><BookMarked className="h-5 w-5 mx-auto mb-1 text-green-600" /><p className="text-2xl font-bold">{availableCount}</p><p className="text-xs text-muted-foreground">Available</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Library className="h-5 w-5 mx-auto mb-1 text-orange-600" /><p className="text-2xl font-bold">{borrowedCount}</p><p className="text-xs text-muted-foreground">Borrowed</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><BookCopy className="h-5 w-5 mx-auto mb-1 text-purple-600" /><p className="text-2xl font-bold">{stats.categories ?? '-'}</p><p className="text-xs text-muted-foreground">Categories</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Books Inventory</CardTitle>
          <div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search books..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-8"><AlertCircle className="h-8 w-8 text-destructive" /><p className="text-muted-foreground">Failed to load library</p><Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button></div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center gap-3 py-8"><BookOpen className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No books found</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>ISBN</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Available / Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.title}</TableCell>
                    <TableCell>{b.author}</TableCell>
                    <TableCell className="text-xs">{b.isbn || '-'}</TableCell>
                    <TableCell><Badge variant="outline">{b.category || '-'}</Badge></TableCell>
                    <TableCell>{b.available ?? 0} / {b.total ?? 0}</TableCell>
                    <TableCell><Badge variant={(b.available ?? 0) > 0 ? 'success' : 'warning'}>{(b.available ?? 0) > 0 ? 'Available' : 'Borrowed'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {(b.available ?? 0) > 0 ? (
                          <Button variant="ghost" size="icon" className="text-blue-600" title="Borrow" onClick={() => borrowMutation.mutate({ bookId: b.id })} disabled={borrowMutation.isPending}>
                            <ArrowLeftRight className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" className="text-green-600" title="Return" onClick={() => returnMutation.mutate(b.id)} disabled={returnMutation.isPending}>
                            <BookMarked className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
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
            <DialogTitle>Add Book</DialogTitle>
            <DialogDescription>Add a new book to the library inventory</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Book title" /></div>
            <div className="space-y-2"><Label>Author *</Label><Input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="Author name" /></div>
            <div className="space-y-2"><Label>ISBN</Label><Input value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} placeholder="978-0-1234-5678-1" /></div>
            <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Textbook / Fiction" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Total Copies</Label><Input type="number" value={form.total} onChange={e => setForm({ ...form, total: e.target.value })} placeholder="10" /></div>
              <div className="space-y-2"><Label>Available</Label><Input type="number" value={form.available} onChange={e => setForm({ ...form, available: e.target.value })} placeholder="10" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setForm({ title: '', author: '', isbn: '', category: '', total: '', available: '' }); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>{createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
