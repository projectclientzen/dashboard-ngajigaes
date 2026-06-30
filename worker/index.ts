/// <reference lib="webworker" />
export type {}

// ── Push event ─────────────────────────────────────────────
self.addEventListener('push', ((event: PushEvent) => {
  if (!event.data) return
  const data = event.data.json() as { title?: string; body?: string; url?: string }
  event.waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).registration.showNotification(
      data.title ?? 'NgajiGaes',
      {
        body: data.body ?? '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: 'daily-reminder',
        data: { url: data.url ?? '/daily-reports' },
      }
    )
  )
}) as EventListener)

// ── Notification click ──────────────────────────────────────
self.addEventListener('notificationclick', ((event: NotificationEvent) => {
  event.notification.close()
  const url = (event.notification.data as { url?: string })?.url ?? '/daily-reports'
  event.waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => 'focus' in c)
        if (existing) {
          existing.navigate(url)
          return existing.focus()
        }
        return (self as unknown as ServiceWorkerGlobalScope).clients.openWindow(url)
      })
  )
}) as EventListener)
