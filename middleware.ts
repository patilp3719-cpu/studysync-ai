export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/planner/:path*',
    '/sessions/:path*',
    '/analyzer/:path*',
    '/exams/:path*',
    '/reminders/:path*',
    '/flashcards/:path*',
    '/timer/:path*',
    '/games/:path*',
    '/devzone/:path*',
  ],
}
