'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import {
  IconGamepad, IconBrain, IconKeyboard, IconHelpCircle, IconCards,
  IconGradCap, IconCode, IconMenu, IconX,
} from './Icons'

const gamesNav = [
  { href: '/games',           Icon: IconGamepad,    label: 'All Games' },
  { href: '/games/memory',    Icon: IconBrain,      label: 'Memory Match' },
  { href: '/games/typing',    Icon: IconKeyboard,   label: 'Typing Speed' },
  { href: '/games/quiz',      Icon: IconHelpCircle, label: 'CS Quiz' },
  { href: '/games/flashcards',Icon: IconCards,      label: 'Flashcard Challenge' },
]

export default function GamesSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const content = (
    <div className="flex flex-col h-full bg-gray-950 text-white">
      {/* Header */}
      <div className="px-4 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-1">
          <IconGamepad size={20} className="text-gray-300" />
          <span className="font-bold text-white text-base">Games Zone</span>
        </div>
        <p className="text-xs text-gray-500">StudySync AI</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest px-3 mb-2">Games</p>
        {gamesNav.map(({ href, Icon, label }) => {
          const active = href === '/games' ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition
                ${active
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <Icon size={17} className="shrink-0" />
              <span>{label}</span>
            </Link>
          )
        })}

        {/* Back to main */}
        <div className="pt-4 border-t border-gray-800 mt-4">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-widest px-3 mb-2">Switch Zone</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition">
            <IconGradCap size={17} className="shrink-0" />
            <span>Main Dashboard</span>
          </button>
          <button
            onClick={() => router.push('/devzone')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mt-1 text-gray-400 hover:bg-gray-800 hover:text-white transition">
            <IconCode size={17} className="shrink-0" />
            <span>Dev Zone</span>
          </button>
        </div>
      </nav>

      {/* Profile */}
      {session && (
        <div className="border-t border-gray-800 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-gray-300 font-bold text-sm shrink-0">
              {session.user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-300 truncate">{session.user?.name}</p>
              <p className="text-xs text-gray-600 truncate">{session.user?.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      <aside className="hidden lg:flex flex-col w-56 h-screen sticky top-0 shrink-0">{content}</aside>
      {/* Mobile bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconGamepad size={18} className="text-gray-300" />
          <span className="font-bold text-white">Games Zone</span>
        </div>
        <button onClick={() => setMobileOpen(o => !o)} className="p-2 rounded-lg border border-gray-700 text-gray-400" aria-label="Menu">
          {mobileOpen ? <IconX size={17} /> : <IconMenu size={17} />}
        </button>
      </div>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 shadow-xl overflow-y-auto">{content}</aside>
        </div>
      )}
    </>
  )
}
