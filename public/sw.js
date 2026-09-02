// StudySync AI Service Worker — handles background push notifications for reminders
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'StudySync AI Reminder'
  const options = {
    body: data.body || 'You have a reminder!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'reminder',
    requireInteraction: true,
    data: { url: data.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})

// Handle scheduled alarm checks via periodic background sync or message
self.addEventListener('message', (event) => {
  if (event.data?.type === 'CHECK_REMINDERS') {
    // This message is sent by the app; used to trigger alarm if needed
    const reminders = event.data.reminders || []
    const now = Date.now()
    reminders.forEach((r) => {
      const due = new Date(r.remindAt).getTime()
      if (!r.done && Math.abs(due - now) < 60000) {
        self.registration.showNotification(`🔔 ${r.title}`, {
          body: r.description || 'Your reminder is due now!',
          tag: `reminder-${r._id}`,
          requireInteraction: true,
          data: { url: '/reminders' },
        })
      }
    })
  }
})
