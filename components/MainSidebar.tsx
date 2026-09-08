'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  IconHome, IconClipboard, IconTimer, IconTarget, IconCalendar,
  IconBell, IconCards, IconGamepad, IconCode,
  IconChevronLeft, IconChevronRight, IconChevronDown, IconChevronUp,
  IconMenu, IconX, IconLogOut,
} from './Icons'
import { LogoSVG } from './SplashScreen'

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

  // Listen for sidebar-toggle custom events dispatched from DashboardClient
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ open: boolean }>).detail
      setCollapsed(!detail.open)
    }
    window.addEventListener('sidebar-toggle', handler)
    return () => window.removeEventListener('sidebar-toggle', handler)
  }, [])
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const content = (
    <div className="flex flex-col h-full"
      style={{ background: 'rgba(10,14,22,0.96)', borderRight: '1px solid rgba(73,68,84,0.5)' }}>

      {/* Logo */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-4'} py-4`}
        style={{ borderBottom: '1px solid rgba(73,68,84,0.4)' }}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: '#1a1535', border: '1px solid rgba(139,92,246,0.35)' }}>
              <LogoSVG size={20} />
            </div>
            <span className="font-bold text-sm tracking-tight text-on-surface">
              StudySync <span style={{ color: '#d0bcff' }}>AI</span>
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: '#1a1535', border: '1px solid rgba(139,92,246,0.35)' }}>
            <LogoSVG size={20} />
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="p-1.5 rounded-lg transition hidden lg:flex shrink-0 hover:bg-surface-high"
          style={{ color: '#958ea0' }}
          aria-label="Toggle sidebar">
          {collapsed
            ? <IconChevronRight size={14} />
            : <IconChevronLeft  size={14} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {!collapsed && (
          <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2"
            style={{ color: '#494454', letterSpacing: '0.1em' }}>Study Tools</p>
        )}
        {mainNav.map(({ href, Icon, label }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group ${collapsed ? 'justify-center' : ''}`}
              style={active ? {
                background: 'rgba(139,92,246,0.15)',
                color: '#d0bcff',
                border: '1px solid rgba(139,92,246,0.3)',
              } : {
                color: '#cbc3d7',
                border: '1px solid transparent',
              }}
              title={collapsed ? label : undefined}>
              <Icon size={16} className="shrink-0" style={{ color: active ? '#d0bcff' : '#958ea0' } as React.CSSProperties} />
              {!collapsed && <span>{label}</span>}
              {active && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#8B5CF6' }} />
              )}
            </Link>
          )
        })}

        {/* Zone switcher */}
        {!collapsed && (
          <p className="text-[10px] font-bold uppercase tracking-widest px-3 mt-5 mb-2"
            style={{ color: '#494454', letterSpacing: '0.1em' }}>Switch Zone</p>
        )}
        {collapsed && <div className="my-3" style={{ borderTop: '1px solid rgba(73,68,84,0.4)' }} />}

        <button
          onClick={() => router.push('/games')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150"
          style={{
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.35)',
            color: '#c0c1ff',
          }}
          title={collapsed ? 'Games Zone' : undefined}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.25)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.15)'
          }}>
          <IconGamepad size={16} className="shrink-0" />
          {!collapsed && <span>Games Zone</span>}
        </button>

        <button
          onClick={() => router.push('/devzone')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 mt-1"
          style={{
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.3)',
            color: '#10B981',
          }}
          title={collapsed ? 'Dev Zone' : undefined}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.2)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.1)'
          }}>
          <IconCode size={16} className="shrink-0" />
          {!collapsed && <span>Dev Zone</span>}
        </button>
      </nav>

      {/* Profile */}
      {session && (
        <div className="p-2" style={{ borderTop: '1px solid rgba(73,68,84,0.4)' }}>
          <button
            onClick={() => setProfileOpen(o => !o)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${collapsed ? 'justify-center' : ''}`}
            style={{ color: '#cbc3d7' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                background: 'linear-gradient(135deg,#8B5CF6,#6366F1)',
                color: '#fff',
              }}>
              {session.user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: '#dfe2ee' }}>{session.user?.name}</p>
                  <p className="text-[10px] truncate" style={{ color: '#958ea0' }}>{session.user?.email}</p>
                </div>
                {profileOpen
                  ? <IconChevronUp   size={12} style={{ color: '#958ea0' }} className="shrink-0" />
                  : <IconChevronDown size={12} style={{ color: '#958ea0' }} className="shrink-0" />}
              </>
            )}
          </button>
          {profileOpen && !collapsed && (
            <div className="mt-1 rounded-xl overflow-hidden"
              style={{
                background: 'rgba(19,27,46,0.95)',
                border: '1px solid rgba(73,68,84,0.5)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(73,68,84,0.4)' }}>
                <p className="text-xs font-bold" style={{ color: '#dfe2ee' }}>{session.user?.name}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#958ea0' }}>{session.user?.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm transition-all duration-150"
                style={{ color: '#ffb4ab' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <IconLogOut size={14} style={{ color: '#ffb4ab' }} />
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{
          background: 'rgba(10,14,22,0.96)',
          borderBottom: '1px solid rgba(73,68,84,0.5)',
          backdropFilter: 'blur(12px)',
        }}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: '#1a1535', border: '1px solid rgba(139,92,246,0.35)' }}>
            <LogoSVG size={18} />
          </div>
          <span className="font-bold text-sm" style={{ color: '#dfe2ee' }}>
            StudySync <span style={{ color: '#d0bcff' }}>AI</span>
          </span>
        </Link>
        <button onClick={() => setMobileOpen(o => !o)}
          className="p-2 rounded-lg"
          style={{ border: '1px solid rgba(73,68,84,0.5)', color: '#cbc3d7' }}
          aria-label="Menu">
          {mobileOpen ? <IconX size={16} /> : <IconMenu size={16} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 overflow-y-auto shadow-2xl">{content}</aside>
        </div>
      )}
    </>
  )
}
