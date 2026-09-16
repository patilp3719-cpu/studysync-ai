'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  IconSunrise, IconSun, IconSunset, IconMoon,
  IconTrophy, IconZap, IconAlertTriangle, IconMenu,
} from './Icons'

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
]

const features = [
  {
    href: '/planner', emoji: '🗓️', label: 'AI Planner',
    desc: 'Generate a time-aware study schedule from your tasks using AI.',
    gradFrom: '#1d4ed8', gradTo: '#4338ca',
    glow: 'rgba(59,130,246,0.25)', badge: 'AI',
  },
  {
    href: '/sessions', emoji: '⏱️', label: 'Sessions',
    desc: 'Log planned vs actual times. Detect your procrastination patterns.',
    gradFrom: '#6d28d9', gradTo: '#4c1d95',
    glow: 'rgba(139,92,246,0.25)', badge: 'TRACK',
  },
  {
    href: '/analyzer', emoji: '🎯', label: 'Focus Analyzer',
    desc: 'Visualize focus vs distraction. Get AI feedback on your deep work.',
    gradFrom: '#065f46', gradTo: '#047857',
    glow: 'rgba(16,185,129,0.25)', badge: 'AI',
  },
  {
    href: '/timer', emoji: '🍅', label: 'Pomodoro Timer',
    desc: 'Focus sessions with circular timer, points & a GitHub-style heatmap.',
    gradFrom: '#c2410c', gradTo: '#9a3412',
    glow: 'rgba(249,115,22,0.25)', badge: 'XP',
  },
  {
    href: '/exams', emoji: '📅', label: 'Countdown',
    desc: 'Add exams & events. AI generates a personalised prep checklist.',
    gradFrom: '#b91c1c', gradTo: '#991b1b',
    glow: 'rgba(239,68,68,0.25)', badge: 'AI',
  },
  {
    href: '/reminders', emoji: '🔔', label: 'Reminders',
    desc: 'Real-time alarm system. Browser notifications even when tab is closed.',
    gradFrom: '#b45309', gradTo: '#92400e',
    glow: 'rgba(245,158,11,0.25)', badge: 'LIVE',
  },
  {
    href: '/flashcards', emoji: '🃏', label: 'Flashcards',
    desc: 'Paste notes or upload PDF/DOCX — AI generates 8 quiz cards instantly.',
    gradFrom: '#0e7490', gradTo: '#155e75',
    glow: 'rgba(6,182,212,0.25)', badge: 'AI',
  },
  {
    href: '/games', emoji: '🎮', label: 'Games Zone',
    desc: 'Memory match, typing speed, CS quiz & flashcard challenge.',
    gradFrom: '#4338ca', gradTo: '#3730a3',
    glow: 'rgba(99,102,241,0.3)', badge: 'FUN',
  },
  {
    href: '/devzone', emoji: '💻', label: 'Dev Zone',
    desc: 'DSA tracker, project board, interview prep & tech stack advisor.',
    gradFrom: '#064e3b', gradTo: '#065f46',
    glow: 'rgba(16,185,129,0.3)', badge: 'DEV',
  },
]

type GreetingIcon = 'sunrise' | 'sun' | 'sunset' | 'moon'
function getTimeGreeting(hour: number): { greeting: string; iconType: GreetingIcon; sub: string } {
  if (hour >= 5  && hour < 12) return { greeting: 'Good Morning',   iconType: 'sunrise', sub: 'Rise and shine — your goals await!' }
  if (hour >= 12 && hour < 17) return { greeting: 'Good Afternoon', iconType: 'sun',     sub: 'Midday check-in — keep the momentum going!' }
  if (hour >= 17 && hour < 21) return { greeting: 'Good Evening',   iconType: 'sunset',  sub: 'Evening hustle — great time to review your day.' }
  return { greeting: 'Good Night', iconType: 'moon', sub: "Rest well — tomorrow's another chance to excel." }
}

function GreetingIcon({ type, size = 22 }: { type: GreetingIcon; size?: number }) {
  if (type === 'sunrise') return <IconSunrise size={size} style={{ color: '#F59E0B' }} />
  if (type === 'sun')     return <IconSun     size={size} style={{ color: '#F59E0B' }} />
  if (type === 'sunset')  return <IconSunset  size={size} style={{ color: '#F97316' }} />
  return <IconMoon size={size} style={{ color: '#7bd0ff' }} />
}

interface DashboardClientProps {
  firstName: string
  upcomingExams: Array<{ subject: string; examDate: string }>
  doneTasks: number
  pendingTasks: number
  streak: number
  procrastinationGap: number | null
  focusRatio: number | null
  lastSessionSubject: string | null
  lastSessionDate: string | null
  lastFocusSubject: string | null
  lastFocusDate: string | null
  nextTaskTitle: string | null
  nextTaskDue: string | null
}

export default function DashboardClient({
  firstName, upcomingExams, doneTasks, pendingTasks, streak,
  procrastinationGap, focusRatio,
  lastSessionSubject, lastSessionDate,
  lastFocusSubject, lastFocusDate,
  nextTaskTitle, nextTaskDue,
}: DashboardClientProps) {
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [now, setNow] = useState(new Date())
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setQuoteIndex(Math.floor(Date.now() / 30000) % QUOTES.length)
    const interval = setInterval(() => {
      setQuoteIndex(Math.floor(Date.now() / 30000) % QUOTES.length)
      setNow(new Date())
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  // Sync sidebar open state to the sidebar element via custom event
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { open: sidebarOpen } }))
  }, [sidebarOpen])

  const istOffset = 5.5 * 60 * 60 * 1000
  const istDate = new Date(now.getTime() + istOffset - now.getTimezoneOffset() * 60000)
  const hour = istDate.getUTCHours()
  const { greeting, iconType, sub } = getTimeGreeting(hour)
  const quote = QUOTES[quoteIndex]

  const urgentEvent = upcomingExams.find(e => {
    const days = Math.ceil((new Date(e.examDate).getTime() - Date.now()) / 86400000)
    return days >= 0 && days <= 3
  })
  const showAchievement = doneTasks > 0 && doneTasks % 5 === 0

  const stats = [
    {
      label: 'Pending Tasks',
      value: pendingTasks === 0 ? 'Done ✓' : String(pendingTasks),
      // Green = done/on-track, Blue = neutral info
      color: pendingTasks === 0 ? '#10B981' : '#3b82d4',
      sub: nextTaskTitle ? `Next: ${nextTaskTitle}` : pendingTasks === 0 ? 'All caught up!' : 'Open Planner to see tasks',
      subExtra: nextTaskDue ? `Due ${nextTaskDue}` : pendingTasks === 0 ? '' : '',
      hint: pendingTasks === 0 && doneTasks === 0 ? 'Go to Planner to add your first task.' : undefined,
    },
    {
      label: 'Session Gap',
      value: procrastinationGap === null ? '—' : procrastinationGap > 0 ? `+${procrastinationGap}m late` : 'On time',
      // Red = overdue/late, Green = on-track
      color: procrastinationGap === null ? '#958ea0' : procrastinationGap > 0 ? '#EF4444' : '#10B981',
      sub: procrastinationGap === null ? 'Log a session to track gaps'
        : procrastinationGap > 0
          ? `Started ${procrastinationGap}m later than planned`
          : 'Started on time — great discipline!',
      subExtra: lastSessionDate ?? '',
      hint: procrastinationGap === null ? 'Log a session in Sessions to start tracking.' : undefined,
    },
    {
      label: 'Focus Ratio',
      value: focusRatio === null ? '—' : `${focusRatio}%`,
      // Green = focused, Red = distracted, Blue = neutral
      color: focusRatio === null ? '#958ea0' : focusRatio >= 70 ? '#10B981' : focusRatio >= 40 ? '#F59E0B' : '#EF4444',
      sub: focusRatio === null ? 'No focus data yet' : lastFocusSubject ?? 'No logs yet',
      subExtra: lastFocusDate ?? '',
      bar: focusRatio,
      hint: focusRatio === null ? 'Complete a Pomodoro session to see your focus ratio.' : undefined,
    },
    {
      label: 'Study Streak',
      value: `${streak}d`,
      // Green = active streak, muted = no streak
      color: streak > 0 ? '#F59E0B' : '#958ea0',
      sub: streak > 0 ? `${streak} day${streak !== 1 ? 's' : ''} in a row — keep it going!` : 'Log today to start a new streak!',
      subExtra: '',
      hint: streak === 0 ? 'Complete any Pomodoro session today to start your streak.' : undefined,
    },
  ]

  return (
    <div className="space-y-8">

      {/* ── TOP NAV BAR ── */}
      <div className="flex items-center justify-between">
        {/* Sidebar toggle — only visible on desktop (lg+); mobile uses the fixed top bar */}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150"
          style={{
            background: sidebarOpen ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)',
            border: sidebarOpen ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(73,68,84,0.5)',
            color: sidebarOpen ? '#d0bcff' : '#958ea0',
          }}
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <IconMenu size={16} />
        </button>

        {/* Page title */}
        <div className="flex items-center gap-2">
          <GreetingIcon type={iconType} size={18} />
          <h1 className="text-base font-bold tracking-tight" style={{ color: '#dfe2ee' }}>
            {greeting}, <span style={{ color: '#d0bcff' }}>{firstName}</span>
          </h1>
          {streak > 0 && (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981' }}>
              <IconZap size={9} />{streak}d streak
            </span>
          )}
        </div>

        {/* Quote pill — truncated with tooltip on hover */}
          <div className="hidden sm:flex items-center gap-2 rounded-lg px-3 py-1.5 max-w-xs group relative"
            style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.18)' }}>
            <p className="font-mono text-[10px] italic truncate" style={{ color: '#cbc3d7' }}>"{quote.text}"</p>
            {/* Full quote tooltip */}
            <span className="absolute z-50 bottom-full left-0 mb-2 hidden group-hover:block w-72 rounded-lg px-3 py-2 text-[11px] leading-snug shadow-xl"
              style={{ background: 'rgba(10,14,22,0.97)', border: '1px solid rgba(73,68,84,0.6)', color: '#cbc3d7' }}>
              "{quote.text}" — {quote.author}
            </span>
          </div>
      </div>

      {/* ── SUBTITLE ── */}
      <p className="text-sm -mt-4" style={{ color: '#958ea0' }}>{sub}</p>

      {/* ── ALERTS ── */}
      {urgentEvent && (
        <div className="rounded-xl px-4 py-3 flex items-start gap-3"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <IconAlertTriangle size={16} style={{ color: '#F59E0B' }} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm" style={{ color: '#F59E0B' }}>
              {Math.ceil((new Date(urgentEvent.examDate).getTime() - Date.now()) / 86400000) === 0
                ? `It's the day of your "${urgentEvent.subject}" event! You've got this!`
                : `"${urgentEvent.subject}" is coming up in ${Math.ceil((new Date(urgentEvent.examDate).getTime() - Date.now()) / 86400000)} day(s)!`}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#958ea0' }}>Stay calm, you're prepared. Do your best!</p>
          </div>
        </div>
      )}
      {showAchievement && (
        <div className="rounded-xl px-4 py-3 flex items-start gap-3"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <IconTrophy size={16} style={{ color: '#10B981' }} className="shrink-0 mt-0.5" />
          <p className="font-bold text-sm" style={{ color: '#10B981' }}>
            {doneTasks} tasks completed! {pendingTasks > 0 ? `${pendingTasks} to go — keep it up!` : 'All caught up!'}
          </p>
        </div>
      )}

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl p-4"
            style={{ background: 'rgba(19,27,46,0.8)', border: '1px solid rgba(51,65,85,0.4)' }}>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: '#494454' }}>{s.label}</p>
            <p className="text-2xl font-bold font-mono tabular-nums leading-none"
              style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1.5" style={{ color: '#cbc3d7' }}>{s.sub}</p>
            {s.subExtra && (
              <p className="font-mono text-[10px] mt-0.5" style={{ color: '#958ea0' }}>{s.subExtra}</p>
            )}
            {s.bar !== undefined && s.bar !== null && (
              <div className="w-full rounded-full h-0.5 mt-2" style={{ background: 'rgba(73,68,84,0.4)' }}>
                <div className="h-0.5 rounded-full" style={{ width: `${s.bar}%`, background: s.color }} />
              </div>
            )}
            {/* Empty-state hint — shown when value is zero/unknown */}
            {'hint' in s && s.hint && (
              <p className="font-mono text-[10px] mt-2 leading-snug" style={{ color: '#494454' }}>{s.hint}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── FEATURES SECTION ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest"
            style={{ color: '#494454' }}>Features</p>
          <div className="flex-1 h-px" style={{ background: 'rgba(73,68,84,0.3)' }} />
          <p className="font-mono text-[10px]" style={{ color: '#494454' }}>{features.length} tools</p>
        </div>

        {/* Group features by subheading */}
        {(
          [
            { heading: 'Plan', hrefs: ['/planner'] },
            { heading: 'Track', hrefs: ['/sessions', '/analyzer', '/exams', '/reminders'] },
            { heading: 'Focus', hrefs: ['/timer', '/flashcards'] },
            { heading: 'Games & Dev', hrefs: ['/games', '/devzone'] },
          ] as { heading: string; hrefs: string[] }[]
        ).map(group => {
          const groupFeatures = features.filter(f => group.hrefs.includes(f.href))
          if (groupFeatures.length === 0) return null
          return (
            <div key={group.heading} className="mb-6">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-3"
                style={{ color: '#8B5CF6' }}>{group.heading}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupFeatures.map(f => (
                  <Link key={f.href} href={f.href}
                    className="group block rounded-2xl p-5 hover:scale-[1.03] transition-all duration-200 shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${f.gradFrom}, ${f.gradTo})`,
                      boxShadow: `0 8px 24px ${f.glow}`,
                    }}>
                    <div className="text-4xl mb-3">{f.emoji}</div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base font-bold text-white">{f.label}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)' }}>
                        {f.badge}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{f.desc}</p>
                    <div className="mt-4 flex items-center gap-1 text-xs transition-colors"
                      style={{ color: 'rgba(255,255,255,0.55)' }}>
                      <span className="group-hover:text-white transition-colors">Open</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
