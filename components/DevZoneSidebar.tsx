'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import {
  IconCode, IconBarChart, IconFolder, IconMic, IconWrench,
  IconGradCap, IconGamepad, IconMenu, IconX,
} from './Icons'

const devNav = [
  { href: '/devzone',           Icon: IconCode,      label: 'Dev Zone Home' },
  { href: '/devzone/dsa',       Icon: IconBarChart,  label: 'DSA Tracker' },
  { href: '/devzone/projects',  Icon: IconFolder,    label: 'Project Board' },
  { href: '/devzone/interview', Icon: IconMic,       label: 'Interview Prep' },
  { href: '/devzone/stack',     Icon: IconWrench,    label: 'Tech Stack' },
]

export default function DevZoneSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const content = (
    <div className="flex flex-col h-full" style={{ background: 'rgba(10,14,22,0.96)', borderRight: '1px solid rgba(73,68,84,0.5)' }}>
      {/* Header */}
      <div className="px-4 py-5" style={{ borderBottom: '1px solid rgba(73,68,84,0.4)' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <IconCode size={14} style={{ color: '#10B981' }} />
          </div>
          <span className="font-bold text-sm" style={{ color: '#dfe2ee' }}>Dev Zone</span>
        </div>
        <p className="font-mono text-[10px] ml-9" style={{ color: '#958ea0' }}>StudySync AI</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2" style={{ color: '#494454' }}>Developer Tools</p>
        {devNav.map(({ href, Icon, label }) => {
          const active = href === '/devzone' ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={active
                ? { background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }
                : { color: '#cbc3d7', border: '1px solid transparent' }}>
              <Icon size={16} className="shrink-0" />
              <span>{label}</span>
            </Link>
          )
        })}

        {/* Switch zone */}
        <div className="pt-4 mt-4" style={{ borderTop: '1px solid rgba(73,68,84,0.4)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2" style={{ color: '#494454' }}>Switch Zone</p>
          <button onClick={() => router.push('/dashboard')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{ color: '#cbc3d7', border: '1px solid transparent' }}>
            <IconGradCap size={16} className="shrink-0" />
            <span>Main Dashboard</span>
          </button>
          <button onClick={() => router.push('/games')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mt-1 transition-all"
            style={{ background: 'rgba(99,102,241,0.1)', color: '#c0c1ff', border: '1px solid rgba(99,102,241,0.25)' }}>
            <IconGamepad size={16} className="shrink-0" />
            <span>Games Zone</span>
          </button>
        </div>
      </nav>

      {/* Profile */}
      {session && (
        <div className="p-3" style={{ borderTop: '1px solid rgba(73,68,84,0.4)' }}>
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg,#8B5CF6,#6366F1)', color: '#fff' }}>
              {session.user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: '#dfe2ee' }}>{session.user?.name}</p>
              <p className="text-[10px] truncate" style={{ color: '#958ea0' }}>{session.user?.email}</p>
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(10,14,22,0.96)', borderBottom: '1px solid rgba(73,68,84,0.5)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <IconCode size={12} style={{ color: '#10B981' }} />
          </div>
          <span className="font-bold text-sm" style={{ color: '#dfe2ee' }}>Dev Zone</span>
        </div>
        <button onClick={() => setMobileOpen(o => !o)} className="p-2 rounded-lg"
          style={{ border: '1px solid rgba(73,68,84,0.5)', color: '#cbc3d7' }} aria-label="Menu">
          {mobileOpen ? <IconX size={16} /> : <IconMenu size={16} />}
        </button>
      </div>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 shadow-2xl overflow-y-auto">{content}</aside>
        </div>
      )}
    </>
  )
}
