import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import SessionProviderWrapper from '@/components/SessionProviderWrapper'
import NotificationWatcher from '@/components/NotificationWatcher'
import EnvironmentWrapper from '@/components/EnvironmentWrapper'
import { TimerProvider } from '@/components/TimerContext'
import FloatingTimerBar from '@/components/FloatingTimerBar'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'StudySync AI',
  description: 'AI-powered student productivity and time management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans bg-surface text-on-surface antialiased">
        <SessionProviderWrapper>
          <TimerProvider>
            <NotificationWatcher />
            <FloatingTimerBar />
            <EnvironmentWrapper>
              {children}
            </EnvironmentWrapper>
          </TimerProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  )
}
