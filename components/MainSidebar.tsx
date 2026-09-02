'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  IconHome, IconClipboard, IconTimer, IconTarget, IconCalendar,
  IconBell, IconCards, IconGamepad, IconCode, IconGradCap,
  IconChevronLeft, IconChevronRight, IconChevronDown, IconChevronUp,
  IconMenu, IconX, IconUser, IconLogOut,
} from './Icons'

const mainNav = [
  { href: '/dashboard', Icon: IconHome,      label: 'Dashboard' },
  { href: '/planner',   Icon: IconClipboard, label: 'Planner' },
  { href: '/sessions',  Icon: IconTimer,     label: 'Sessions' },
  { href: '/analyzer',  Icon: IconTarget,    label: 'Analyzer' },
  { href: '/timer',     Icon: IconTimer,     label: 'Timer' },
  { href: '/exams',     Icon: IconCalendar,  label: 'Countdown' },
  { href: '/reminders', Icon: IconBell,      label: 'Reminders' },
  { href: '/flashcards',Icon: IconCards,     label: 'Flashcards' },
]

export default function MainSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-4'} py-4 border-b border-gray-100`}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <IconGradCap size={22} className="text-gray-700" />
            <span className="font-bold text-gray-900">StudySync <span className="text-purple-600">AI</span></span>
          </Link>
        )}
        {collapsed && <IconGradCap size={22} className="text-gray-700" />}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition hidden lg:flex shrink-0"
          aria-label="Toggle sidebar">
          {collapsed
            ? <IconChevronRight size={16} className="text-gray-400" />
            : <IconChevronLeft  size={16} className="text-gray-400" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {!collapsed && (
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Study Tools</p>
        )}
        {mainNav.map(({ href, Icon, label }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition group
                ${active ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
              title={collapsed ? label : undefined}>
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}

        {/* Environment switcher */}
        {!collapsed && (
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 mt-5 mb-2">Switch Zone</p>
        )}
        {collapsed && <div className="border-t border-gray-100 my-3" />}

        <button
          onClick={() => router.push('/games')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition
            bg-gray-900 text-white hover:bg-gray-800 shadow-sm"
          title={collapsed ? 'Games Zone' : undefined}>
          <IconGamepad size={18} className="shrink-0" />
          {!collapsed && <span>Games Zone</span>}
        </button>

        <button
          onClick={() => router.push('/devzone')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition mt-1
            bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-sm"
          title={collapsed ? 'Dev Zone' : undefined}>
          <IconCode size={18} className="shrink-0" />
          {!collapsed && <span>Dev Zone</span>}
        </button>
      </nav>

      {/* Profile */}
      {session && (
        <div className="border-t border-gray-100 p-2">
          <button
            onClick={() => setProfileOpen(o => !o)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-600 font-bold text-sm shrink-0">
              {session.user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{session.user?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{session.user?.email}</p>
                </div>
                {profileOpen
                  ? <IconChevronUp   size={14} className="text-gray-400 shrink-0" />
                  : <IconChevronDown size={14} className="text-gray-400 shrink-0" />}
              </>
            )}
          </button>
          {profileOpen && !collapsed && (
            <div className="mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-bold text-gray-800">{session.user?.name}</p>
                <p className="text-xs text-gray-500">{session.user?.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition">
                <IconLogOut size={15} className="text-red-500" />
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className={`hidden lg:flex flex-col h-screen sticky top-0 transition-all duration-200 shrink-0 ${collapsed ? 'w-16' : 'w-56'}`}>
        {content}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <IconGradCap size={20} className="text-gray-700" />
          <span className="font-bold text-gray-900">StudySync <span className="text-purple-600">AI</span></span>
        </Link>
        <button onClick={() => setMobileOpen(o => !o)} className="p-2 rounded-lg border border-gray-200" aria-label="Menu">
          {mobileOpen ? <IconX size={18} className="text-gray-600" /> : <IconMenu size={18} className="text-gray-600" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 shadow-xl overflow-y-auto">{content}</aside>
        </div>
      )}
    </>
  )
}
