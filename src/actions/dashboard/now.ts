import 'server-only'

import { cacheLife } from 'next/cache'

export const readClock = async () => {
  'use cache'
  cacheLife({ stale: 60, revalidate: 300, expire: 900 })

  return await Promise.resolve(Date.now())
}
