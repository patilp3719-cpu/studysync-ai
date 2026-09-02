'use client'

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

type Phase = 'focus' | 'break'

interface TimerState {
  running: boolean
  phase: Phase
  secondsLeft: number
  focusMins: number
  breakMins: number
  category: string
  sessionsCount: number
}

interface TimerContextType {
  state: TimerState
  start: () => void
  pause: () => void
  reset: () => void
  setFocusMins: (m: number) => void
  setBreakMins: (m: number) => void
  setCategory: (c: string) => void
  completedUninterrupted: boolean
  clearCompleted: () => void
}

const defaultState: TimerState = {
  running: false,
  phase: 'focus',
  secondsLeft: 25 * 60,
  focusMins: 25,
  breakMins: 5,
  category: '',
  sessionsCount: 0,
}

const TimerContext = createContext<TimerContextType | null>(null)

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TimerState>(defaultState)
  const [completedUninterrupted, setCompletedUninterrupted] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const wasInterrupted = useRef(false)

  const tick = useCallback(() => {
    setState(prev => {
      if (prev.secondsLeft <= 1) {
        // Phase complete
        if (prev.phase === 'focus' && !wasInterrupted.current) {
          setCompletedUninterrupted(true)
        }
        const nextPhase: Phase = prev.phase === 'focus' ? 'break' : 'focus'
        const nextSecs = nextPhase === 'focus' ? prev.focusMins * 60 : prev.breakMins * 60
        wasInterrupted.current = false
        if (typeof window !== 'undefined' && Notification.permission === 'granted') {
          new Notification(prev.phase === 'focus' ? '✅ Focus session done!' : '⏰ Break over!', {
            body: prev.phase === 'focus' ? `Take a ${prev.breakMins}min break.` : 'Time to focus again.',
          })
        }
        return {
          ...prev,
          phase: nextPhase,
          secondsLeft: nextSecs,
          running: false,
          sessionsCount: prev.phase === 'focus' ? prev.sessionsCount + 1 : prev.sessionsCount,
        }
      }
      return { ...prev, secondsLeft: prev.secondsLeft - 1 }
    })
  }, [])

  useEffect(() => {
    if (state.running) {
      intervalRef.current = setInterval(tick, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [state.running, tick])

  const start = useCallback(() => {
    setState(s => ({ ...s, running: true }))
  }, [])

  const pause = useCallback(() => {
    wasInterrupted.current = true
    setState(s => ({ ...s, running: false }))
  }, [])

  const reset = useCallback(() => {
    wasInterrupted.current = true
    setState(s => ({ ...s, running: false, phase: 'focus', secondsLeft: s.focusMins * 60 }))
  }, [])

  const setFocusMins = useCallback((m: number) => {
    setState(s => ({ ...s, focusMins: m, ...(!s.running && s.phase === 'focus' ? { secondsLeft: m * 60 } : {}) }))
  }, [])

  const setBreakMins = useCallback((m: number) => {
    setState(s => ({ ...s, breakMins: m, ...(!s.running && s.phase === 'break' ? { secondsLeft: m * 60 } : {}) }))
  }, [])

  const setCategory = useCallback((c: string) => {
    setState(s => ({ ...s, category: c }))
  }, [])

  const clearCompleted = useCallback(() => setCompletedUninterrupted(false), [])

  return (
    <TimerContext.Provider value={{ state, start, pause, reset, setFocusMins, setBreakMins, setCategory, completedUninterrupted, clearCompleted }}>
      {children}
    </TimerContext.Provider>
  )
}

export function useTimer() {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useTimer must be used inside TimerProvider')
  return ctx
}
