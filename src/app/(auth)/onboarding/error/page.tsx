import { Suspense } from 'react'

import { AlertCircleIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { LoadingFallback } from '@/components/layout/loading-fallback'
import { Button } from '@/components/ui/button'
import { AUTH_ROOT } from '@/lib/constants'
import { intlMetadata } from '@/lib/metadata'
import metadata from '~/config/metadata.json'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Join',
    title: 'errorTitle',
  })

const OnboardingErrorPage = async () => {
  const t = await getTranslations('Join')

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircleIcon className="size-8 text-destructive" />
        </div>
        <h1 className="mb-2 text-2xl font-semibold">{t('errorTitle')}</h1>
        <p className="mb-8 text-muted-foreground">{t('errorDescription', { email: metadata.email })}</p>
        <Button asChild variant="outline">
          <a href={AUTH_ROOT}>{t('backToLogin')}</a>
        </Button>
      </div>
    </div>
  )
}

export default () => (
  <Suspense fallback={<LoadingFallback />}>
    <OnboardingErrorPage />
  </Suspense>
)
