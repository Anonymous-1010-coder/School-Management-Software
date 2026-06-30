'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, Plus, Edit, Trash2, Loader2, AlertCircle, Layers, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
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
import { inventoryApi } from '@/lib/endpoints';
import { formatCurrency } from '@/lib/utils';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'In Stock': 'default',
  'Low Stock': 'secondary',
  'Out of Stock': 'destructive',
};

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', category: '', quantity: '', unitPrice: '', minStock: '' });

  const { data: inventoryData, isLoading, isError, refetch } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryApi.getAll().then(r => r.data.data),
  });

  const { data: statsData } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: () => inventoryApi.getStats().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => inventoryApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }); queryClient.invalidateQueries({ queryKey: ['inventory-stats'] }); toast({ title: 'Item added', variant: 'success' }); setShowAdd(false); resetForm(); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to add item', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => inventoryApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }); queryClient.invalidateQueries({ queryKey: ['inventory-stats'] }); toast({ title: 'Item updated', variant: 'success' }); setEditingId(null); setShowAdd(false); resetForm(); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }); queryClient.invalidateQueries({ queryKey: ['inventory-stats'] }); toast({ title: 'Item deleted', variant: 'success' }); },
    onError: () => toast({ title: 'Error deleting item', variant: 'destructive' }),
  });

  const resetForm = () => setForm({ name: '', category: '', quantity: '', unitPrice: '', minStock: '' });

  const handleEdit = (item: any) => {
    setForm({
      name: item.name,
      category: item.category || '',
      quantity: item.quantity?.toString() || '',
      unitPrice: item.unitPrice?.toString() || '',
      minStock: item.minStock?.toString() || '',
    });
    setEditingId(item.id);
    setShowAdd(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.quantity) {
      toast({ title: 'Name and quantity are required', variant: 'destructive' });
      return;
    }
    const payload = {
      ...form,
      quantity: parseInt(form.quantity),
      unitPrice: form.unitPrice ? parseInt(form.unitPrice) : undefined,
      minStock: form.minStock ? parseInt(form.minStock) : undefined,
    };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  };

  const items = Array.isArray(inventoryData) ? inventoryData : inventoryData?.items || [];
  const stats = statsData || {};
  const totalItems = stats?.totalItems ?? stats?.total ?? items.length;
  const inStock = stats?.inStock ?? stats?.in_stock ?? 0;
  const lowStock = stats?.lowStock ?? stats?.low_stock ?? 0;
  const outOfStock = stats?.outOfStock ?? stats?.out_of_stock ?? 0;

  const getStatus = (item: any) => {
    const qty = item.quantity ?? 0;
    const min = item.minStock ?? item.min_stock ?? 0;
    if (qty <= 0) return 'Out of Stock';
    if (qty <= min) return 'Low Stock';
    return 'In Stock';
  };

  const filtered = items.filter((i: any) =>
    !search || i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Inventory</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Inventory</h1><p className="text-muted-foreground">Manage school assets, stock, and supplies</p></div>
        <Button className="gap-2" onClick={() => { resetForm(); setEditingId(null); setShowAdd(true); }}><Plus className="h-4 w-4" /> Add Item</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4 text-center"><Layers className="h-5 w-5 mx-auto mb-1 text-blue-600" /><p className="text-2xl font-bold">{totalItems}</p><p className="text-xs text-muted-foreground">Total Items</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Package className="h-5 w-5 mx-auto mb-1 text-green-600" /><p className="text-2xl font-bold">{inStock}</p><p className="text-xs text-muted-foreground">In Stock</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><AlertTriangle className="h-5 w-5 mx-auto mb-1 text-orange-600" /><p className="text-2xl font-bold">{lowStock}</p><p className="text-xs text-muted-foreground">Low Stock</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><XCircle className="h-5 w-5 mx-auto mb-1 text-red-600" /><p className="text-2xl font-bold">{outOfStock}</p><p className="text-xs text-muted-foreground">Out of Stock</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Items</CardTitle>
          <div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search inventory..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-8"><AlertCircle className="h-8 w-8 text-destructive" /><p className="text-muted-foreground">Failed to load inventory</p><Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button></div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center gap-3 py-8"><Package className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No items found</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Min Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item: any, i: number) => {
                  const status = getStatus(item);
                  return (
                    <TableRow key={item.id || i}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell><Badge variant="outline">{item.category || '-'}</Badge></TableCell>
                      <TableCell className={item.quantity <= (item.minStock ?? item.min_stock ?? 0) ? 'text-red-600 font-medium' : ''}>{item.quantity ?? 0}</TableCell>
                      <TableCell>{item.unitPrice ? formatCurrency(item.unitPrice) : '-'}</TableCell>
                      <TableCell>{item.minStock ?? item.min_stock ?? '-'}</TableCell>
                      <TableCell><Badge variant={status === 'In Stock' ? 'success' : status === 'Low Stock' ? 'warning' : 'destructive'}>{status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm('Delete this item?')) deleteMutation.mutate(item.id); }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            <DialogDescription>Fill in the details to {editingId ? 'update' : 'add'} an inventory item</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Whiteboard Markers" /></div>
            <div className="space-y-2"><Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stationery">Stationery</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Lab">Lab</SelectItem>
                  <SelectItem value="Furniture">Furniture</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Quantity *</Label><Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="e.g., 200" /></div>
            <div className="space-y-2"><Label>Unit Price</Label><Input type="number" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} placeholder="e.g., 500" /></div>
            <div className="space-y-2"><Label>Min Stock Level</Label><Input type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} placeholder="e.g., 50" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); resetForm(); setEditingId(null); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : editingId ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
