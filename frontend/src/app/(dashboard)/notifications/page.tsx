'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, Loader2, AlertCircle, Info, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { communicationApi } from '@/lib/endpoints';
import { cn } from '@/lib/utils';

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  INFO: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  SUCCESS: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
  WARNING: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  ERROR: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
  PENDING: { icon: Clock, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: notifData, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => communicationApi.getNotifications().then(r => r.data.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => communicationApi.markRead(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notifications'] }); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to mark as read', variant: 'destructive' }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => Promise.all(notifications.filter((n: any) => !n.read).map((n: any) => communicationApi.markRead(n.id))),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notifications'] }); toast({ title: 'All marked as read', variant: 'success' }); },
    onError: () => toast({ title: 'Error marking all as read', variant: 'destructive' }),
  });

  const notifications = notifData?.notifications || notifData || [];

  const handleClick = (n: any) => {
    setSelectedId(selectedId === n.id ? null : n.id);
    if (!n.read) markReadMutation.mutate(n.id);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Notifications</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Notifications</h1><p className="text-muted-foreground">Stay updated with school activities</p></div>
        <Button variant="outline" className="gap-2" onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending}>
          <CheckCheck className="h-4 w-4" /> Mark All Read
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>All Notifications</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-8"><AlertCircle className="h-8 w-8 text-destructive" /><p className="text-muted-foreground">Failed to load notifications</p><Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button></div>
          ) : !notifications.length ? (
            <div className="flex flex-col items-center gap-3 py-8"><Bell className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No notifications yet</p></div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n: any) => {
                const type = n.type?.toUpperCase() || 'INFO';
                const config = typeConfig[type] || typeConfig.INFO;
                const Icon = config.icon;
                const isSelected = selectedId === n.id;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-colors border',
                      n.read ? 'bg-card hover:bg-muted/50' : 'bg-muted/30 hover:bg-muted/50 border-primary/20',
                      isSelected && 'border-primary'
                    )}
                    onClick={() => handleClick(n)}
                  >
                    <div className={cn('p-2 rounded-full', config.bg)}>
                      <Icon className={cn('h-5 w-5', config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={cn('text-sm font-medium', !n.read && 'font-semibold')}>{n.title}</h3>
                        <div className="flex items-center gap-2 shrink-0">
                          {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : n.timestamp || ''}</span>
                        </div>
                      </div>
                      <p className={cn('text-sm mt-1', n.read ? 'text-muted-foreground' : 'text-foreground')}>{n.message}</p>
                      {isSelected && n.metadata && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs text-muted-foreground">
                          {typeof n.metadata === 'string' ? n.metadata : JSON.stringify(n.metadata)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
