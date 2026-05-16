const CACHE_NAME = `glore-${buildId}`
const OFFLINE_URL = '/offline'

const buildId = new URL(self.location.href).searchParams.get('buildId') || 'dev'

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
      const cachesKeys = await caches.keys()
      const keys = cachesKeys.filter(key => key !== CACHE_NAME)
      await Promise.all(keys.map(key => caches.delete(key)))
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
