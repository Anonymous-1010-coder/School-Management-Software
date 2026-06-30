'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { examApi, examSessionApi } from '@/lib/endpoints'
import { useAntiCheat } from '@/components/shared/anti-cheat-monitor'
import { CbtTimer } from '@/components/shared/cbt-timer'
import { toast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Clock, AlertTriangle, Flag, Save, Send, CheckCircle, Loader2,
  Monitor, ShieldAlert, FileText, Play, BookOpen, HelpCircle,
  ChevronLeft, ChevronRight, Maximize2, GripVertical
} from 'lucide-react'

const MAX_VIOLATIONS = 5
const AUTO_SAVE_INTERVAL = 30000
const ACTIVITY_PING_INTERVAL = 60000

export default function ExamPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [examState, setExamState] = useState<'intro' | 'loading' | 'ready' | 'started' | 'submitting' | 'submitted' | 'error'>('intro')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showLockAlert, setShowLockAlert] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [timeSpent, setTimeSpent] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showExitWarning, setShowExitWarning] = useState(false)
  const answersRef = useRef(answers)
  const timeSpentRef = useRef(timeSpent)

  answersRef.current = answers
  timeSpentRef.current = timeSpent

  const { data: examRes, isLoading: examLoading, isError: examError } = useQuery({
    queryKey: ['exam', id],
    queryFn: () => examApi.getById(id),
    enabled: true,
  })

  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ['exam-questions', id],
    queryFn: () => examApi.getQuestions(id),
    enabled: examState === 'loading' || examState === 'ready' || examState === 'started',
  })

  const createSessionMutation = useMutation({
    mutationFn: () => examSessionApi.create({ examId: id }),
    onSuccess: (res) => {
      setSessionId(res.data?.data?.id || res.data?.id)
    },
    onError: () => {
      toast({ title: 'Session creation failed', variant: 'destructive' })
    },
  })

  const saveMutation = useMutation({
    mutationFn: (data: { answers: Record<string, string>; timeSpent: number }) =>
      examApi.saveAnswers(id, data),
  })

  const submitMutation = useMutation({
    mutationFn: (data: { answers: Record<string, string>; timeSpent: number }) =>
      examApi.submit(id, data),
    onSuccess: () => {
      setExamState('submitted')
      setShowSubmitDialog(false)
      if (sessionId) {
        examSessionApi.endSession(sessionId).catch(() => {})
      }
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {})
      }
      queryClient.invalidateQueries({ queryKey: ['exam', id] })
      toast({ title: 'Exam submitted successfully', variant: 'success' })
    },
    onError: (err: any) => {
      toast({
        title: 'Submission failed',
        description: err.response?.data?.message || 'Please try again',
        variant: 'destructive',
      })
      setExamState('started')
    },
  })

  const exam = examRes?.data
  const questions = questionsData?.data?.questions || questionsData?.data || []
  const totalQuestions = questions.length
  const answeredCount = Object.keys(answers).length
  const progress = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0

  const autoSave = useCallback(() => {
    const currentAnswers = answersRef.current
    const answered = Object.keys(currentAnswers).length
    if (answered > 0 && sessionId) {
      saveMutation.mutate({ answers: currentAnswers, timeSpent: timeSpentRef.current })
    }
  }, [sessionId])

  useEffect(() => {
    if (examState !== 'started') return
    const interval = setInterval(autoSave, AUTO_SAVE_INTERVAL)
    return () => clearInterval(interval)
  }, [autoSave, examState])

  useEffect(() => {
    if (examState !== 'started' || !sessionId) return
    const interval = setInterval(() => {
      examSessionApi.updateActivity(sessionId).catch(() => {})
    }, ACTIVITY_PING_INTERVAL)
    return () => clearInterval(interval)
  }, [examState, sessionId])

  useEffect(() => {
    if (examState !== 'started') return
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [examState])

  useEffect(() => {
    if (examState === 'loading' && questions.length > 0) {
      setExamState('ready')
    }
  }, [examState, questions])

  useEffect(() => {
    if (!examLoading && examError) {
      setExamState('error')
    }
  }, [examLoading, examError])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (examState === 'started') {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [examState])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (examState !== 'started') return
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.ctrlKey && e.key === 'U')) {
        e.preventDefault()
        return false
      }
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'a' || e.key === 's')) {
        e.preventDefault()
        return false
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [examState])

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (examState === 'started') e.preventDefault()
    }
    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [examState])

  const enterFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement
      if (el.requestFullscreen) {
        await el.requestFullscreen()
        setIsFullscreen(true)
      }
    } catch {
      setIsFullscreen(false)
    }
  }, [])

  useEffect(() => {
    const handleFsChange = () => {
      const fs = !!document.fullscreenElement
      setIsFullscreen(fs)
      if (examState === 'started' && !fs) {
        setShowExitWarning(true)
      }
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [examState])

  const handleAnswer = (qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }))
  }

  const toggleFlag = (qId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(qId)) next.delete(qId)
      else next.add(qId)
      return next
    })
  }

  const handleStart = async () => {
    setExamState('loading')
    try {
      await createSessionMutation.mutateAsync()
    } catch {
      setExamState('ready')
    }
    const fs = document.fullscreenElement
    if (!fs) {
      try {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } catch {
        setIsFullscreen(false)
      }
    } else {
      setIsFullscreen(true)
    }
    setExamState('started')
  }

  const handleSubmit = () => {
    setExamState('submitting')
    submitMutation.mutate({ answers, timeSpent })
  }

  const handleTimeUp = () => {
    toast({ title: 'Time is up! Submitting your exam...', variant: 'destructive' })
    setShowSubmitDialog(false)
    handleSubmit()
  }

  const handleAutoSubmit = useCallback(() => {
    toast({ title: 'Auto-submitting due to multiple violations', variant: 'destructive' })
    if (sessionId) {
      examSessionApi.logEvent(sessionId, { eventType: 'auto_submit', details: 'Max violations reached', severity: 'high' }).catch(() => {})
    }
    submitMutation.mutate({ answers: answersRef.current, timeSpent: timeSpentRef.current })
  }, [sessionId])

  const { warnings } = useAntiCheat(sessionId || id, {
    maxWarnings: MAX_VIOLATIONS,
    onSuspicious: () => {
      if (sessionId) {
        examSessionApi.updateActivity(sessionId).catch(() => {})
      }
    },
    onMaxWarnings: () => {
      setShowLockAlert(false)
      handleAutoSubmit()
    },
  })

  if (examState === 'submitted') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-10 pb-10">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Exam Submitted Successfully</h2>
            <p className="text-muted-foreground mb-2">Your answers have been recorded.</p>
            <p className="text-muted-foreground mb-6 text-sm">You will be notified when your results are available.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
              {exam?.title && (
                <Button variant="outline" onClick={() => router.push('/examinations')}>View Exams</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (examState === 'error' || (!examLoading && !exam)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-10">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Exam Not Found</h2>
            <p className="text-muted-foreground mb-6">This exam could not be loaded. It may have been removed or you may not have access.</p>
            <Button onClick={() => router.push('/examinations')}>Back to Exams</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (examState === 'intro' || examLoading || questionsLoading) {
    if (examLoading || questionsLoading) {
      return (
        <div className="space-y-6 p-4 sm:p-8">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96" />
          <div className="grid gap-4 md:grid-cols-3 mt-8">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
          <Skeleton className="h-12 w-full mt-4" />
          <Skeleton className="h-64 w-full mt-4" />
        </div>
      )
    }

    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{exam?.title || 'Computer-Based Test'}</CardTitle>
            <CardDescription className="text-base mt-2">
              Read the instructions carefully before starting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-primary">{questions.length}</p>
                <p className="text-sm text-muted-foreground">Questions</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-primary">{exam?.duration || 0}</p>
                <p className="text-sm text-muted-foreground">Minutes</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-primary">{exam?.totalMarks || questions.length}</p>
                <p className="text-sm text-muted-foreground">Total Marks</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4" /> Instructions
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-primary font-bold">•</span> This exam will be taken in fullscreen mode. Do not attempt to exit fullscreen.</li>
                <li className="flex gap-2"><span className="text-primary font-bold">•</span> Do not switch tabs or open other applications during the exam.</li>
                <li className="flex gap-2"><span className="text-primary font-bold">•</span> Copying, pasting, or printing is strictly prohibited.</li>
                <li className="flex gap-2"><span className="text-primary font-bold">•</span> Your answers are auto-saved every 30 seconds. You can also save manually.</li>
                <li className="flex gap-2"><span className="text-primary font-bold">•</span> You can flag questions for review using the flag icon.</li>
                <li className="flex gap-2"><span className="text-primary font-bold">•</span> Once you submit, you cannot retake or modify your answers.</li>
                <li className="flex gap-2"><span className="text-primary font-bold">•</span> The exam will auto-submit when the timer reaches zero.</li>
              </ul>
            </div>

            <Separator />

            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">Anti-Cheat Notice</p>
                  <p className="text-amber-700 dark:text-amber-300 mt-1">
                    Suspicious activities are monitored. After {MAX_VIOLATIONS} warnings, the exam will be auto-submitted.
                  </p>
                </div>
              </div>
            </div>

            <Button size="lg" className="w-full gap-2" onClick={handleStart}>
              <Play className="h-5 w-5" /> Start Exam
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <Dialog open={showLockAlert} onOpenChange={setShowLockAlert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Suspicious Activity Detected
            </DialogTitle>
            <DialogDescription>
              Multiple suspicious events have been detected ({warnings}/{MAX_VIOLATIONS}).
              If this continues, your exam will be auto-submitted. Please stay focused on your exam screen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowLockAlert(false)}>I understand</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showExitWarning} onOpenChange={setShowExitWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Maximize2 className="h-5 w-5" /> Fullscreen Required
            </DialogTitle>
            <DialogDescription>
              You have exited fullscreen mode. This exam must be taken in fullscreen. Please re-enter fullscreen to continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={async () => {
                try {
                  await document.documentElement.requestFullscreen()
                  setIsFullscreen(true)
                  setShowExitWarning(false)
                } catch {
                  toast({ title: 'Could not enter fullscreen', variant: 'destructive' })
                }
              }}
            >
              Re-enter Fullscreen
            </Button>
            <Button variant="destructive" onClick={() => handleAutoSubmit()}>
              Submit Exam Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Exam</DialogTitle>
            <DialogDescription>
              <div className="space-y-3 mt-2">
                <p>You are about to submit your exam. This action cannot be undone.</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{answeredCount}</p>
                    <p className="text-xs text-muted-foreground">Answered</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold text-destructive">{totalQuestions - answeredCount}</p>
                    <p className="text-xs text-muted-foreground">Unanswered</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-500">{flagged.size}</p>
                    <p className="text-xs text-muted-foreground">Flagged</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{totalQuestions}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
                {answeredCount < totalQuestions && (
                  <p className="text-destructive text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    You still have {totalQuestions - answeredCount} unanswered question{(totalQuestions - answeredCount) > 1 ? 's' : ''}.
                  </p>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>Review Answers</Button>
            <Button variant="destructive" onClick={handleSubmit} disabled={submitMutation.isPending}>
              {submitMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : 'Submit Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-bold truncate">{exam?.title || 'Exam'}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              {answeredCount} of {totalQuestions} answered
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {warnings > 0 && (
              <Badge variant="destructive" className="hidden sm:inline-flex gap-1">
                <AlertTriangle className="h-3 w-3" /> {warnings}
              </Badge>
            )}
            {!isFullscreen && (
              <Badge variant="warning" className="gap-1">
                <Maximize2 className="h-3 w-3" /> No FS
              </Badge>
            )}
            <div className="flex items-center gap-2 font-mono text-base sm:text-lg font-bold">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              <CbtTimer duration={exam?.duration || 60} onTimeUp={handleTimeUp} />
            </div>
          </div>
        </div>
        <Progress value={progress} className="h-1.5 rounded-none" />
      </div>

      <div className="flex flex-1 flex-col lg:flex-row gap-4 p-4">
        <Card className="order-2 lg:order-1 lg:w-64 shrink-0">
          <CardHeader className="p-3 sm:p-4 pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Question Palette</span>
              <span className="text-xs text-muted-foreground font-normal">{answeredCount}/{totalQuestions}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <ScrollArea className="h-auto max-h-[200px] lg:max-h-[400px]">
              <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-5 gap-1.5">
                {questions.map((q: any, i: number) => {
                  const isAnswered = answers[q.id] !== undefined
                  const isFlagged = flagged.has(q.id)
                  const isCurrent = i === currentIndex
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(i)}
                      className={`
                        relative h-8 w-8 rounded-md text-xs font-medium transition-all
                        ${isCurrent ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-background' : ''}
                        ${isFlagged && isAnswered ? 'bg-yellow-400 text-yellow-900 dark:bg-yellow-500 dark:text-yellow-950' : ''}
                        ${isFlagged && !isAnswered ? 'bg-yellow-100 text-yellow-700 border border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700' : ''}
                        ${isAnswered && !isFlagged && !isCurrent ? 'bg-primary text-primary-foreground' : ''}
                        ${!isAnswered && !isFlagged && !isCurrent ? 'bg-muted text-muted-foreground hover:bg-muted/80' : ''}
                      `}
                      title={`Question ${i + 1}${isFlagged ? ' (Flagged)' : ''}${isAnswered ? ' (Answered)' : ''}`}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
            <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-primary" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-muted" />
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-yellow-400" />
                <span>Flagged</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="order-1 lg:order-2 flex-1 flex flex-col">
          <Card className="flex-1">
            <CardContent className="p-4 sm:p-6">
              {currentQuestion && (
                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="shrink-0">
                          Question {currentIndex + 1} of {totalQuestions}
                        </Badge>
                        {flagged.has(currentQuestion.id) && (
                          <Badge variant="warning" className="shrink-0">Flagged</Badge>
                        )}
                        {currentQuestion.questionType && (
                          <Badge variant="secondary" className="shrink-0">{currentQuestion.questionType}</Badge>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-medium leading-relaxed">
                        {currentQuestion.questionText || currentQuestion.question}
                      </h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFlag(currentQuestion.id)}
                      className={flagged.has(currentQuestion.id) ? 'text-yellow-500 shrink-0' : 'shrink-0'}
                      title={flagged.has(currentQuestion.id) ? 'Unflag for review' : 'Flag for review'}
                    >
                      <Flag className={`h-4 w-4 ${flagged.has(currentQuestion.id) ? 'fill-current' : ''}`} />
                    </Button>
                  </div>

                  {currentQuestion.questionType === 'THEORY' || currentQuestion.questionType === 'ESSAY' ? (
                    <textarea
                      className="flex min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                      placeholder="Type your answer here..."
                      disabled={examState !== 'started'}
                    />
                  ) : (
                    <div className="space-y-3">
                      {(currentQuestion.options || []).map((option: any, oi: number) => {
                        const optionText = typeof option === 'string' ? option : option.text || option.value || String(option)
                        const optionLabel = String.fromCharCode(65 + oi)
                        return (
                          <label
                            key={oi}
                            className={`
                              flex items-start gap-3 rounded-lg border p-3 sm:p-4 cursor-pointer transition-all
                              hover:bg-accent hover:border-accent-foreground/20
                              ${answers[currentQuestion.id] === optionText
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : ''
                              }
                            `}
                          >
                            <input
                              type="radio"
                              name={`q-${currentQuestion.id}`}
                              value={optionText}
                              checked={answers[currentQuestion.id] === optionText}
                              onChange={() => handleAnswer(currentQuestion.id, optionText)}
                              className="mt-1 h-4 w-4 shrink-0 text-primary"
                              disabled={examState !== 'started'}
                            />
                            <span className="text-sm sm:text-base">
                              <span className="font-semibold mr-2">{optionLabel}.</span>
                              {optionText}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                      disabled={currentIndex === 0 || examState !== 'started'}
                      className="w-full sm:w-auto"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => autoSave()}
                        disabled={saveMutation.isPending || examState !== 'started'}
                        className="flex-1 sm:flex-none"
                      >
                        {saveMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        Save
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowSubmitDialog(true)}
                        disabled={examState !== 'started'}
                        className="flex-1 sm:flex-none"
                      >
                        <Send className="h-4 w-4 mr-1" /> Submit
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentIndex(Math.min(totalQuestions - 1, currentIndex + 1))}
                      disabled={currentIndex === totalQuestions - 1 || examState !== 'started'}
                      className="w-full sm:w-auto"
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
