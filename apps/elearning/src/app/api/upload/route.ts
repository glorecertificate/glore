import { createRouteHandler } from 'uploadthing/next'

import { ourFileRouter } from '@/lib/storage/uploader'

export const { GET, POST } = createRouteHandler({ router: ourFileRouter })
