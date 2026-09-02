'use client'

import { useEffect, useRef, useCallback } from 'react'

interface Reminder {
  _id: string
  title: string
  description?: string
  remindAt: string
  type: string
  done: boolean
}

const TYPE_EMOJI: Record<string, string> = {
  exam: '📝',
  task: '📋',
  deadline: '⏰',
  meeting: '🗣️',
  custom: '🔔',
}

function getTypeEmoji(type: string): string {
  return TYPE_EMOJI[type] ?? '🔔'
}

// This component runs in background and fires browser notifications for due reminders
// It works alongside the Service Worker registered by the Reminders page
export default function NotificationWatcher() {
  const firedRef = useRef<Set<string>>(new Set())

  const checkReminders = useCallback(async () => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    try {
      const res = await fetch('/api/reminders')
      if (!res.ok) return
      const reminders: Reminder[] = await res.json()

      const now = new Date()

      // If service worker is active, delegate to it and return
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CHECK_REMINDERS',
          reminders,
        })
        return
      }

      // Fallback: fire notifications directly from this watcher
      reminders.forEach(r => {
        if (r.done) return
        if (firedRef.current.has(r._id)) return

        const remindTime = new Date(r.remindAt)
        const diffMs = remindTime.getTime() - now.getTime()

        // Fire if within the next 60 seconds (or already past by up to 5 min)
        if (diffMs <= 60000 && diffMs >= -5 * 60 * 1000) {
          firedRef.current.add(r._id)
          const emoji = getTypeEmoji(r.type)
          new Notification(`${emoji} Reminder: ${r.title}`, {
            body: r.description || `Scheduled for ${new Date(r.remindAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} IST`,
            icon: '/favicon.ico',
            tag: `reminder-${r._id}`,
            requireInteraction: true,
          } as NotificationOptions)
        }
      })
    } catch {}
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Register service worker if not already registered
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // Request permission on mount if not yet decided
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Check immediately and then every 30 seconds
    const interval = setInterval(checkReminders, 30000)
    checkReminders()

    return () => clearInterval(interval)
  }, [checkReminders])

  return null // invisible component
}
