import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import SessionProviderWrapper from '@/components/SessionProviderWrapper'
import NotificationWatcher from '@/components/NotificationWatcher'
import EnvironmentWrapper from '@/components/EnvironmentWrapper'
import { TimerProvider } from '@/components/TimerContext'
import FloatingTimerBar from '@/components/FloatingTimerBar'

const nunito = Nunito({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StudySync AI',
  description: 'AI-powered student productivity and time management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={nunito.className}>
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
