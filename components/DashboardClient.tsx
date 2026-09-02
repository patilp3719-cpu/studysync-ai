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
  { text: "In order to be irreplaceable, one must always be different.", author: "Coco Chanel" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
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

function GreetingIcon({ type, size = 22 }: { type: GreetingIcon; size?: number }) {
  const cls = 'text-gray-600 shrink-0'
  if (type === 'sunrise') return <IconSunrise size={size} className={cls} />
  if (type === 'sun')     return <IconSun     size={size} className={cls} />
  if (type === 'sunset')  return <IconSunset  size={size} className={cls} />
  return <IconMoon size={size} className={cls} />
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
    // Rotate quote every 30 seconds
    const qi = Math.floor(Date.now() / 30000) % QUOTES.length
    setQuoteIndex(qi)
    const interval = setInterval(() => {
      setQuoteIndex(Math.floor(Date.now() / 30000) % QUOTES.length)
      setNow(new Date())
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  // IST offset: UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000
  const istDate = new Date(now.getTime() + istOffset - now.getTimezoneOffset() * 60000)
  const hour = istDate.getUTCHours()

  const { greeting, iconType, sub } = getTimeGreeting(hour)
  const quote = QUOTES[quoteIndex]

  // Wishing card: exam within 3 days
  const urgentEvent = upcomingExams.find(e => {
    const days = Math.ceil((new Date(e.examDate).getTime() - Date.now()) / 86400000)
    return days >= 0 && days <= 3
  })

  // Achievement: done tasks milestone
  const showAchievement = doneTasks > 0 && doneTasks % 5 === 0

  return (
    <div className="space-y-5">
      {/* Greeting + Quote */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
                <GreetingIcon type={iconType} size={20} />
                <h1 className="text-xl font-bold text-gray-800">
                  {greeting}, {firstName}!
                </h1>
                {streak > 0 && (
                  <span className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    <IconZap size={11} className="text-gray-500" /> {streak}d streak
                  </span>
                )}
              </div>
            <p className="text-sm text-gray-500">{sub}</p>
          </div>
          <div className="bg-white/70 border border-indigo-100 rounded-xl px-4 py-3 max-w-xs">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">Quote of the moment</p>
            <p className="text-sm text-gray-700 italic leading-relaxed">"{quote.text}"</p>
            <p className="text-xs text-gray-400 mt-1">— {quote.author}</p>
          </div>
        </div>
      </div>

      {/* Wishing card */}
      {urgentEvent && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <IconAlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800 text-sm">
              {Math.ceil((new Date(urgentEvent.examDate).getTime() - Date.now()) / 86400000) === 0
                ? `It's the day of your "${urgentEvent.subject}" event! You've got this!`
                : `"${urgentEvent.subject}" is coming up in ${Math.ceil((new Date(urgentEvent.examDate).getTime() - Date.now()) / 86400000)} day(s)!`}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">All the best — stay calm, you're prepared. Do your best!</p>
          </div>
        </div>
      )}

      {/* Achievement card */}
      {showAchievement && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <IconTrophy size={20} className="text-gray-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-gray-800 text-sm">
              You've completed {doneTasks} task{doneTasks > 1 ? 's' : ''}!
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Keep the momentum — {pendingTasks > 0 ? `${pendingTasks} more to go!` : "All caught up. Set new goals!"}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
