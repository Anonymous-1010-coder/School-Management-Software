'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Search, Plus, Send, Bell, Mail, MessageCircle, Loader2, AlertCircle, Inbox } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { communicationApi } from '@/lib/endpoints';
import { formatDate } from '@/lib/utils';

export default function CommunicationPage() {
  const queryClient = useQueryClient();
  const [showCompose, setShowCompose] = useState(false);
  const [composeForm, setComposeForm] = useState({ recipientId: '', subject: '', body: '' });

  const { data: inboxData, isLoading: inboxLoading, isError: inboxError, refetch: refetchInbox } = useQuery({
    queryKey: ['inbox'],
    queryFn: () => communicationApi.getInbox().then(r => r.data.data),
  });

  const { data: sentData, isLoading: sentLoading, isError: sentError, refetch: refetchSent } = useQuery({
    queryKey: ['sent'],
    queryFn: () => communicationApi.getSent().then(r => r.data.data),
  });

  const { data: notifData, isLoading: notifLoading, isError: notifError, refetch: refetchNotif } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => communicationApi.getNotifications().then(r => r.data.data),
  });

  const sendMutation = useMutation({
    mutationFn: (data: any) => communicationApi.send(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sent'] }); queryClient.invalidateQueries({ queryKey: ['inbox'] }); toast({ title: 'Message sent', variant: 'success' }); setShowCompose(false); setComposeForm({ recipientId: '', subject: '', body: '' }); },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.message || 'Failed to send', variant: 'destructive' }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => communicationApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inbox'] }),
  });

  const inbox = Array.isArray(inboxData) ? inboxData : inboxData?.messages || inboxData?.data || [];
  const sent = Array.isArray(sentData) ? sentData : sentData?.messages || sentData?.data || [];
  const notifications = Array.isArray(notifData) ? notifData : notifData?.notifications || notifData?.data || [];

  const unreadCount = inbox.filter((m: any) => !m.read && m.status !== 'read').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Communication</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Communication</h1><p className="text-muted-foreground">Send messages, broadcast notifications, and manage communications</p></div>
        <Button className="gap-2" onClick={() => setShowCompose(true)}><Send className="h-4 w-4" /> Compose Message</Button>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox" className="gap-2"><Inbox className="h-4 w-4" /> Inbox {unreadCount > 0 && <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">{unreadCount}</Badge>}</TabsTrigger>
          <TabsTrigger value="sent" className="gap-2"><Send className="h-4 w-4" /> Sent</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" /> Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Inbox</CardTitle></CardHeader>
            <CardContent>
              {inboxLoading ? (
                <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
              ) : inboxError ? (
                <div className="flex flex-col items-center gap-3 py-8"><AlertCircle className="h-8 w-8 text-destructive" /><p className="text-muted-foreground">Failed to load inbox</p><Button variant="outline" size="sm" onClick={() => refetchInbox()}>Retry</Button></div>
              ) : !inbox.length ? (
                <div className="flex flex-col items-center gap-3 py-8"><Inbox className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">Inbox is empty</p></div>
              ) : (
                <div className="space-y-2">
                  {inbox.map((m: any, i: number) => (
                    <div key={m.id || i} className={`flex items-start gap-4 rounded-lg border p-3 cursor-pointer ${!m.read && m.status !== 'read' ? 'bg-muted/50 border-primary/20' : ''}`} onClick={() => { if (!m.read && m.status !== 'read') markReadMutation.mutate(m.id); }}>
                      <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${!m.read && m.status !== 'read' ? 'bg-blue-500' : 'bg-transparent'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">{m.from?.firstName ? `${m.from.firstName} ${m.from.lastName}` : m.from?.name || m.fromName || m.from || 'Unknown'}</p>
                          <span className="text-xs text-muted-foreground shrink-0">{m.createdAt ? formatDate(m.createdAt) : m.date || ''}</span>
                        </div>
                        <p className="text-sm font-medium mt-0.5">{m.subject}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{m.body || m.message || ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Sent Messages</CardTitle></CardHeader>
            <CardContent>
              {sentLoading ? (
                <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
              ) : sentError ? (
                <div className="flex flex-col items-center gap-3 py-8"><AlertCircle className="h-8 w-8 text-destructive" /><p className="text-muted-foreground">Failed to load sent messages</p><Button variant="outline" size="sm" onClick={() => refetchSent()}>Retry</Button></div>
              ) : !sent.length ? (
                <div className="flex flex-col items-center gap-3 py-8"><Send className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No sent messages</p></div>
              ) : (
                <div className="space-y-2">
                  {sent.map((m: any, i: number) => (
                    <div key={m.id || i} className="flex items-start gap-4 rounded-lg border p-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">To: {m.to?.firstName ? `${m.to.firstName} ${m.to.lastName}` : m.to?.name || m.toName || m.to || 'Unknown'}</p>
                          <span className="text-xs text-muted-foreground shrink-0">{m.createdAt ? formatDate(m.createdAt) : m.date || ''}</span>
                        </div>
                        <p className="text-sm font-medium mt-0.5">{m.subject}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{m.body || m.message || ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
            <CardContent>
              {notifLoading ? (
                <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
              ) : notifError ? (
                <div className="flex flex-col items-center gap-3 py-8"><AlertCircle className="h-8 w-8 text-destructive" /><p className="text-muted-foreground">Failed to load notifications</p><Button variant="outline" size="sm" onClick={() => refetchNotif()}>Retry</Button></div>
              ) : !notifications.length ? (
                <div className="flex flex-col items-center gap-3 py-8"><Bell className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No notifications</p></div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n: any, i: number) => (
                    <div key={n.id || i} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                      <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${n.type === 'Info' || n.type === 'info' ? 'bg-blue-500' : n.type === 'Success' || n.type === 'success' ? 'bg-green-500' : n.type === 'Pending' || n.type === 'pending' || n.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{n.title || n.subject || 'Notification'}</p>
                        <p className="text-xs text-muted-foreground">{n.message || n.body || ''}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.createdAt ? formatDate(n.createdAt) : n.time || ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Compose Message</DialogTitle>
            <DialogDescription>Send a message to a recipient</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Recipient</Label><Input value={composeForm.recipientId} onChange={e => setComposeForm({ ...composeForm, recipientId: e.target.value })} placeholder="Recipient name or ID" /></div>
            <div className="space-y-2"><Label>Subject</Label><Input value={composeForm.subject} onChange={e => setComposeForm({ ...composeForm, subject: e.target.value })} placeholder="Message subject" /></div>
            <div className="space-y-2"><Label>Body</Label><textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={composeForm.body} onChange={e => setComposeForm({ ...composeForm, body: e.target.value })} placeholder="Type your message..." rows={5} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCompose(false); setComposeForm({ recipientId: '', subject: '', body: '' }); }}>Cancel</Button>
            <Button onClick={() => sendMutation.mutate(composeForm)} disabled={sendMutation.isPending || !composeForm.subject || !composeForm.body}>
              {sendMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : 'Send Message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
