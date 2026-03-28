const buildId = new URL(self.location.href).searchParams.get('buildId') || 'dev'
const CACHE_NAME = `glore-${buildId}`
const OFFLINE_URL = '/offline'

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      await cache.add(OFFLINE_URL)
    })()
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    })()
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return
  if (request.url.includes('/api/')) return

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request)
        } catch {
          return await caches.match(OFFLINE_URL)
        }
      })()
    )
    return
  }

  if (['image', 'font'].includes(request.destination)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request)
        if (cached) return cached
        const response = await fetch(request)
        const copy = response.clone()
        const cache = await caches.open(CACHE_NAME)
        await cache.put(request, copy)
        return response
      })()
    )
  }
})

self.addEventListener('push', event => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/web-app-icon-192x192.png',
      badge: '/favicon-96x96.png',
      data: { url: data.url || '/dashboard' },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'
  event.waitUntil(
    (async () => {
      const list = await clients.matchAll({ type: 'window', includeUncontrolled: true })
      const match = list.find(c => c.url.includes(url) && 'focus' in c)
      if (match) return match.focus()
      return clients.openWindow(url)
    })()
  )
})
