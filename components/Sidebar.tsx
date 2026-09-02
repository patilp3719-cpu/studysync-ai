'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

const mainNav = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/planner', icon: '📋', label: 'Planner' },
  { href: '/sessions', icon: '⏱', label: 'Sessions' },
  { href: '/analyzer', icon: '🎯', label: 'Analyzer' },
  { href: '/timer', icon: '🍅', label: 'Timer' },
  { href: '/exams', icon: '📅', label: 'Exams' },
  { href: '/reminders', icon: '🔔', label: 'Reminders' },
  { href: '/flashcards', icon: '🃏', label: 'Flashcards' },
]

const gamesNav = [
  { href: '/games', icon: '🎮', label: 'All Games' },
  { href: '/games/memory', icon: '🧠', label: 'Memory Match' },
  { href: '/games/typing', icon: '⌨️', label: 'Typing Speed' },
  { href: '/games/quiz', icon: '❓', label: 'Quiz Challenge' },
]

const devNav = [
  { href: '/devzone', icon: '💻', label: 'Dev Zone' },
  { href: '/devzone/dsa', icon: '📊', label: 'DSA Tracker' },
  { href: '/devzone/projects', icon: '🗂️', label: 'Project Board' },
  { href: '/devzone/interview', icon: '🎤', label: 'Interview Prep' },
  { href: '/devzone/stack', icon: '🔧', label: 'Tech Stack' },
]

function NavSection({ title, links, pathname, collapsed }: {
  title: string
  links: typeof mainNav
  pathname: string
  collapsed: boolean
}) {
  return (
    <div className="space-y-0.5">
      {!collapsed && (
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 mb-1 mt-4">{title}</p>
      )}
      {collapsed && <div className="border-t border-gray-100 my-2" />}
      {links.map(link => {
        const active = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
        return (
          <Link key={link.href} href={link.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group
              ${active ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
            title={collapsed ? link.label : undefined}>
            <span className="text-lg shrink-0">{link.icon}</span>
            {!collapsed && <span className="truncate">{link.label}</span>}
          </Link>
        )
      })}
    </div>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo + collapse */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-4 border-b border-gray-100`}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🎓</span>
            <span className="font-bold text-gray-900 text-base">StudySync <span className="text-purple-600">AI</span></span>
          </Link>
        )}
        {collapsed && <span className="text-2xl">🎓</span>}
        <button onClick={() => setCollapsed(c => !c)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition shrink-0 hidden lg:flex">
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <NavSection title="Main" links={mainNav} pathname={pathname} collapsed={collapsed} />
        <NavSection title="Games" links={gamesNav} pathname={pathname} collapsed={collapsed} />
        <NavSection title="Dev Zone" links={devNav} pathname={pathname} collapsed={collapsed} />
      </nav>

      {/* Profile section */}
      {session && (
        <div className="border-t border-gray-100 p-2">
          <button onClick={() => setProfileOpen(o => !o)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {session.user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            {!collapsed && (
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{session.user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{session.user?.email}</p>
              </div>
            )}
            {!collapsed && <span className="text-gray-400 text-xs shrink-0">{profileOpen ? '▲' : '▼'}</span>}
          </button>

          {/* Profile dropdown */}
          {profileOpen && !collapsed && (
            <div className="mt-1 mx-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
                <p className="text-sm font-bold text-gray-800">{session.user?.name}</p>
                <p className="text-xs text-gray-500">{session.user?.email}</p>
              </div>
              <button onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition">
                🚪 Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-white border-r border-gray-200 h-screen sticky top-0 transition-all duration-200 shrink-0
        ${collapsed ? 'w-16' : 'w-56'}`}>
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl">🎓</span>
          <span className="font-bold text-gray-900">StudySync <span className="text-purple-600">AI</span></span>
        </Link>
        <button onClick={() => setMobileOpen(o => !o)}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
          <span className="text-lg">{mobileOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl overflow-y-auto">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
