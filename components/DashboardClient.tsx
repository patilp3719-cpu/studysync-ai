'use client'

import { useEffect, useState } from 'react'
import { IconSunrise, IconSun, IconSunset, IconMoon, IconTrophy, IconZap, IconAlertTriangle } from './Icons'

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "Stay focused and never give up.", author: "Unknown" },
  { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "Experience is the name everyone gives to their mistakes.", author: "Oscar Wilde" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Strive for progress, not perfection.", author: "Unknown" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
]

type GreetingIcon = 'sunrise' | 'sun' | 'sunset' | 'moon'
function getTimeGreeting(hour: number): { greeting: string; iconType: GreetingIcon; sub: string } {
  if (hour >= 5 && hour < 12) return { greeting: 'Good Morning',   iconType: 'sunrise', sub: 'Rise and shine — your goals await!' }
  if (hour >= 12 && hour < 17) return { greeting: 'Good Afternoon', iconType: 'sun',     sub: 'Midday check-in — keep the momentum going!' }
  if (hour >= 17 && hour < 21) return { greeting: 'Good Evening',   iconType: 'sunset',  sub: 'Evening hustle — great time to review your day.' }
  return { greeting: 'Good Night', iconType: 'moon', sub: "Rest well — tomorrow's another chance to excel." }
}

function GreetingIcon({ type, size = 20 }: { type: GreetingIcon; size?: number }) {
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
}

export default function DashboardClient({ firstName, upcomingExams, doneTasks, pendingTasks, streak }: DashboardClientProps) {
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const qi = Math.floor(Date.now() / 30000) % QUOTES.length
    setQuoteIndex(qi)
    const interval = setInterval(() => {
      setQuoteIndex(Math.floor(Date.now() / 30000) % QUOTES.length)
      setNow(new Date())
    }, 10000)
    return () => clearInterval(interval)
  }, [])

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

  return (
    <div className="space-y-4">
      {/* Greeting + Quote */}
      <div className="rounded-xl p-5" style={{
        background: 'rgba(19,27,46,0.7)',
        border: '1px solid rgba(51,65,85,0.4)',
      }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GreetingIcon type={iconType} size={20} />
              <h1 className="text-xl font-bold tracking-tight" style={{ color: '#dfe2ee' }}>
                {greeting}, {firstName}!
              </h1>
              {streak > 0 && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981' }}>
                  <IconZap size={9} /> {streak}d streak
                </span>
              )}
            </div>
            <p className="text-sm" style={{ color: '#958ea0' }}>{sub}</p>
          </div>
          <div className="rounded-lg px-4 py-3 max-w-xs" style={{
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.2)',
          }}>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#8B5CF6' }}>Quote of the moment</p>
            <p className="text-sm italic leading-relaxed" style={{ color: '#cbc3d7' }}>"{quote.text}"</p>
            <p className="text-[10px] mt-1" style={{ color: '#958ea0' }}>— {quote.author}</p>
          </div>
        </div>
      </div>

      {/* Urgent exam warning */}
      {urgentEvent && (
        <div className="rounded-xl px-5 py-4 flex items-start gap-3" style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.3)',
        }}>
          <IconAlertTriangle size={18} style={{ color: '#F59E0B' }} className="shrink-0 mt-0.5" />
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

      {/* Achievement */}
      {showAchievement && (
        <div className="rounded-xl px-5 py-4 flex items-start gap-3" style={{
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.3)',
        }}>
          <IconTrophy size={18} style={{ color: '#10B981' }} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm" style={{ color: '#10B981' }}>
              You've completed {doneTasks} task{doneTasks > 1 ? 's' : ''}!
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#958ea0' }}>
              {pendingTasks > 0 ? `${pendingTasks} more to go — keep the momentum!` : 'All caught up. Set new goals!'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
