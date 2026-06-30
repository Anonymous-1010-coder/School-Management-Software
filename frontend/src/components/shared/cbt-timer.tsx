'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Clock } from 'lucide-react'

interface CbtTimerProps {
  duration: number
  onTimeUp: () => void
  onTick?: (remainingSeconds: number) => void
}

export function CbtTimer({ duration, onTimeUp, onTick }: CbtTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(duration * 60)
  const [isPaused, setIsPaused] = useState(false)
  const onTimeUpRef = useRef(onTimeUp)
  const onTickRef = useRef(onTick)

  onTimeUpRef.current = onTimeUp
  onTickRef.current = onTick

  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onTimeUpRef.current()
          return 0
        }
        const next = prev - 1
        onTickRef.current?.(next)
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isPaused])

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const isWarning = remainingSeconds < 300

  const togglePause = () => setIsPaused((p) => !p)

  return (
    <div className={`flex items-center gap-2 font-mono text-lg font-bold ${isWarning ? 'text-red-500' : 'text-foreground'}`}>
      <Clock className={`h-5 w-5 ${isWarning ? 'animate-pulse' : ''}`} />
      <span>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
      <button
        type="button"
        onClick={togglePause}
        className="ml-2 text-xs underline-offset-2 hover:underline"
        aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
      >
        {isPaused ? 'Resume' : 'Pause'}
      </button>
    </div>
  )
}
