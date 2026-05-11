import { WifiOffIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { Button } from '@/components/ui/button'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'PWA',
    title: 'offlineTitle',
  })

const OfflinePage = async () => {
  const t = await getTranslations('PWA')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <WifiOffIcon className="size-12 text-muted-foreground" />
      <h1 className="text-2xl font-semibold">{t('offlineTitle')}</h1>
      <p className="max-w-sm text-muted-foreground">{t('offlineDescription')}</p>
      <Button onClick={() => window.location.reload()}>{t('offlineRetry')}</Button>
    </div>
  )
}

export default OfflinePage
