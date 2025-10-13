import { createRouteHandler } from 'uploadthing/next'

import { uploader } from '@/lib/assets'

export const { GET, POST } = createRouteHandler({ router: uploader })
