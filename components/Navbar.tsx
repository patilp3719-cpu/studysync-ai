'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  IconHome, IconClipboard, IconTimer, IconTarget, IconCalendar,
  IconBell, IconCards, IconGradCap, IconUser, IconLogOut, IconMenu, IconX,
} from './Icons'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', Icon: IconHome      },
  { href: '/planner',   label: 'Planner',   Icon: IconClipboard },
  { href: '/sessions',  label: 'Sessions',  Icon: IconTimer     },
  { href: '/analyzer',  label: 'Analyzer',  Icon: IconTarget    },
  { href: '/exams',     label: 'Countdown', Icon: IconCalendar  },
  { href: '/reminders', label: 'Reminders', Icon: IconBell      },
  { href: '/flashcards',label: 'Flashcards',Icon: IconCards     },
]

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <IconGradCap size={20} className="text-gray-700" />
          <span className="text-base font-bold text-gray-900">StudySync <span className="text-purple-600">AI</span></span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map(({ href, label, Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition
                ${pathname === href
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {session && (
            <div className="hidden md:flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-full px-3 py-1">
                <IconUser size={13} className="text-gray-400" />
                {session.user?.name?.split(' ')[0]}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center gap-1.5 text-xs text-red-500 border border-red-200 px-3 py-1 rounded-full hover:bg-red-50 transition">
                <IconLogOut size={13} className="text-red-400" />
                Logout
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="md:hidden p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
            aria-label="Menu">
            {menuOpen
              ? <IconX    size={17} className="text-gray-600" />
              : <IconMenu size={17} className="text-gray-600" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map(({ href, label, Icon }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition
                ${pathname === href ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
          {session && (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition">
              <IconLogOut size={16} className="text-red-400" />
              Logout ({session.user?.name?.split(' ')[0]})
            </button>
          )}
        </div>
      )}
    </nav>
  )
}
