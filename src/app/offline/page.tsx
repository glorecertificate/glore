import { OfflineFallback } from '@/components/layout/offline-fallback'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'PWA',
  title: 'offlineTitle',
})

const OfflinePage = () => <OfflineFallback />

export default OfflinePage
