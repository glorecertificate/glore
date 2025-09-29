import { createRouteHandler } from 'uploadthing/next'

import { fileRouter } from '@/lib/storage'

export const { GET, POST } = createRouteHandler({ router: fileRouter })
