import { getTranslations } from 'next-intl/server'

import { ErrorView } from '@/components/layout/error-view'
import { SuspenseLoader } from '@/components/layout/suspense-loader'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { getCurrentUser } from '@/lib/data/server'

export default async () => {
  const user = await getCurrentUser()
  const t = await getTranslations('Common')
  const message = user ? t('backToHome') : t('accessApp')

  return (
    <SuspenseLoader size="full">
      <ErrorView className="min-h-screen" type="not-found">
        <Button asChild size="lg" variant="outline">
          <Link href="/">{message}</Link>
        </Button>
      </ErrorView>
    </SuspenseLoader>
  )
}
