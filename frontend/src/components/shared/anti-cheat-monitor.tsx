'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { examSessionApi } from '@/lib/endpoints'
import { toast } from '@/hooks/use-toast'
import { AlertTriangle } from 'lucide-react'

interface AntiCheatEvent {
  type: string
  time: number
}

interface UseAntiCheatOptions {
  maxWarnings?: number
  onSuspicious?: () => void
  onMaxWarnings?: () => void
}

interface UseAntiCheatReturn {
  warnings: number
  events: AntiCheatEvent[]
  isMonitoring: boolean
  pause: () => void
  resume: () => void
}

export function useAntiCheat(
  sessionId: string,
  options?: UseAntiCheatOptions
): UseAntiCheatReturn {
  const [warnings, setWarnings] = useState(0)
  const [events, setEvents] = useState<AntiCheatEvent[]>([])
  const [isMonitoring, setIsMonitoring] = useState(true)
  const pausedRef = useRef(false)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const logMutation = useMutation({
    mutationFn: (payload: { eventType: string; details: string; severity: string }) =>
      examSessionApi.logEvent(sessionId, payload),
  })

  const logAndWarn = useCallback(
    (eventType: string, severity: string) => {
      if (pausedRef.current) return

      setEvents((prev) => [...prev, { type: eventType, time: Date.now() }])
      setWarnings((prev) => {
        const next = prev + 1
        const opts = optionsRef.current
        opts?.onSuspicious?.()

        toast({
          title: 'Suspicious activity detected',
          description: `${eventType.replace(/_/g, ' ')} — warning ${next}/${opts?.maxWarnings ?? 3}`,
          variant: 'destructive',
        })

        if (next >= (opts?.maxWarnings ?? 3)) {
          opts?.onMaxWarnings?.()
        }

        return next
      })

      logMutation.mutate({ eventType, details: `Detected at ${new Date().toISOString()}`, severity })
    },
    [logMutation]
  )

  useEffect(() => {
    if (!sessionId || !isMonitoring) return

    const handleVisibility = () => {
      if (document.hidden) {
        logAndWarn('visibility_change', 'medium')
      }
    }

    const handleBlur = () => logAndWarn('window_blur', 'medium')
    const handleFocus = () => {}

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      logAndWarn('copy_attempt', 'low')
    }

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault()
      logAndWarn('paste_attempt', 'low')
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('copy', handleCopy)
    document.addEventListener('paste', handlePaste)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('paste', handlePaste)
    }
  }, [sessionId, isMonitoring, logAndWarn])

  const pause = useCallback(() => {
    pausedRef.current = true
    setIsMonitoring(false)
  }, [])

  const resume = useCallback(() => {
    pausedRef.current = false
    setIsMonitoring(true)
  }, [])

  return { warnings, events, isMonitoring, pause, resume }
}
