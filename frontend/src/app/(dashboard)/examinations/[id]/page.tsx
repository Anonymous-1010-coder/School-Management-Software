'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { examApi, examSessionApi } from '@/lib/endpoints'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertTriangle, Eye, Clock, CheckCircle, XCircle, ArrowLeft, Loader2 } from 'lucide-react'

export default function ExaminationPage() {
  const { id } = useParams<{ id: string }>()
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)

  const { data: examRes, isLoading: examLoading } = useQuery({
    queryKey: ['exam', id],
    queryFn: () => examApi.getById(id),
  })

  const { data: submissionsRes, isLoading: subsLoading } = useQuery({
    queryKey: ['exam-submissions', id],
    queryFn: () => examApi.getSubmissions(id),
  })

  const { data: logRes, isLoading: logLoading } = useQuery({
    queryKey: ['exam-log', id],
    queryFn: () => examSessionApi.getExamLog(id),
  })

  const { data: suspiciousRes } = useQuery({
    queryKey: ['exam-suspicious', id],
    queryFn: () => examSessionApi.getSuspicious(id, 3),
  })

  const exam = examRes?.data
  const submissions = submissionsRes?.data?.submissions || submissionsRes?.data || []
  const sessionLog = logRes?.data || []
  const suspicious = suspiciousRes?.data || []

  if (examLoading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" /></div>
  }

  if (!exam) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Exam not found</h2>
        <Button asChild variant="outline"><Link href="/examinations"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Examinations</Link></Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon"><Link href="/examinations"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <p className="text-muted-foreground">
            {exam.examType} | {exam.subject?.name} | {exam.class?.name} | Duration: {exam.duration}min | Total: {exam.totalMarks} marks
          </p>
        </div>
        <Badge className="ml-auto" variant={exam.isActive ? 'success' : 'secondary'}>{exam.isActive ? 'Active' : 'Inactive'}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Submissions</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{submissions.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Graded</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{submissions.filter((s: any) => s.score != null).length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Suspicious Students</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-destructive">{suspicious.length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="submissions">
        <TabsList>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="log">Activity Log</TabsTrigger>
          <TabsTrigger value="suspicious" className="text-destructive">Suspicious ({suspicious.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions">
          <Card>
            <CardContent className="pt-6">
              {subsLoading ? (
                <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
              ) : submissions.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground"><Clock className="h-8 w-8" /><p>No submissions yet</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium">Student</th>
                        <th className="text-left py-3 px-2 font-medium">Score</th>
                        <th className="text-left py-3 px-2 font-medium">Time Spent</th>
                        <th className="text-left py-3 px-2 font-medium">Status</th>
                        <th className="text-right py-3 px-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub: any) => (
                        <tr key={sub.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2 font-medium">{sub.student?.user?.firstName} {sub.student?.user?.lastName}</td>
                          <td className="py-3 px-2">{sub.score != null ? `${sub.score}/${exam.totalMarks}` : <Badge variant="secondary">Not graded</Badge>}</td>
                          <td className="py-3 px-2">{sub.timeSpent ? `${Math.round(sub.timeSpent / 60)} min` : '-'}</td>
                          <td className="py-3 px-2">{sub.submittedAt ? <Badge variant="success">Submitted</Badge> : <Badge variant="secondary">In Progress</Badge>}</td>
                          <td className="py-3 px-2 text-right">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedSubmission(sub)}><Eye className="mr-2 h-4 w-4" /> View</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="log">
          <Card>
            <CardContent className="pt-6">
              {logLoading ? <Skeleton className="h-32 w-full" /> : sessionLog.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground"><Clock className="h-8 w-8" /><p>No activity logged</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium">Student</th>
                        <th className="text-left py-3 px-2 font-medium">Login Time</th>
                        <th className="text-left py-3 px-2 font-medium">Device</th>
                        <th className="text-left py-3 px-2 font-medium">IP</th>
                        <th className="text-left py-3 px-2 font-medium">Events</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionLog.map((session: any) => (
                        <tr key={session.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2">{session.student?.user?.firstName} {session.student?.user?.lastName}</td>
                          <td className="py-3 px-2">{new Date(session.loginTime).toLocaleString()}</td>
                          <td className="py-3 px-2">{session.browser || '-'} / {session.os || '-'}</td>
                          <td className="py-3 px-2">{session.ipAddress || '-'}</td>
                          <td className="py-3 px-2">{session.events?.length || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suspicious">
          <Card>
            <CardContent className="pt-6">
              {suspicious.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground"><CheckCircle className="h-8 w-8" /><p>No suspicious activity detected</p></div>
              ) : (
                <div className="space-y-4">
                  {suspicious.map((session: any) => (
                    <Card key={session.id} className="border-destructive/50">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          <span className="font-semibold">{session.student?.user?.firstName} {session.student?.user?.lastName}</span>
                          <Badge variant="destructive">{session.events?.length} suspicious events</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {session.events?.slice(0, 5).map((ev: any) => (
                            <div key={ev.id} className="flex items-center gap-2">
                              <span className="font-mono text-xs">{new Date(ev.createdAt).toLocaleTimeString()}</span>
                              <span>{ev.eventType}: {ev.details}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>Viewing answers for {selectedSubmission?.student?.user?.firstName} {selectedSubmission?.student?.user?.lastName}</DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex gap-4 text-sm">
                <div>Score: <strong>{selectedSubmission.score ?? 'Not graded'}{selectedSubmission.score != null ? ` / ${exam.totalMarks}` : ''}</strong></div>
                <div>Time: <strong>{selectedSubmission.timeSpent ? `${Math.round(selectedSubmission.timeSpent / 60)} min` : '-'}</strong></div>
                <div>Submitted: <strong>{selectedSubmission.submittedAt ? new Date(selectedSubmission.submittedAt).toLocaleString() : 'No'}</strong></div>
              </div>
              {selectedSubmission.answers && Object.entries(selectedSubmission.answers).map(([qId, ans]: [string, any]) => (
                <div key={qId} className="rounded-lg border p-3">
                  <p className="font-medium text-sm mb-1">Question: {qId}</p>
                  <p className="text-sm text-muted-foreground">Answer: {typeof ans === 'string' ? ans : JSON.stringify(ans)}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
