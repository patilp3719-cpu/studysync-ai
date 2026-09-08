'use client'

import { usePathname } from 'next/navigation'
import MainSidebar from './MainSidebar'
import GamesSidebar from './GamesSidebar'
import DevZoneSidebar from './DevZoneSidebar'

function getEnvironment(pathname: string): 'games' | 'devzone' | 'main' {
  if (pathname.startsWith('/games')) return 'games'
  if (pathname.startsWith('/devzone')) return 'devzone'
  return 'main'
}

const envConfig = {
  main:    { Sidebar: MainSidebar },
  games:   { Sidebar: GamesSidebar },
  devzone: { Sidebar: DevZoneSidebar },
}

export default function EnvironmentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const env = getEnvironment(pathname)
  const { Sidebar } = envConfig[env]

  return (
    <div className="flex min-h-screen" style={{ background: '#0f131c' }}>
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 py-6 mt-14 lg:mt-0" style={{ color: '#dfe2ee' }}>
        <div className="max-w-5xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
