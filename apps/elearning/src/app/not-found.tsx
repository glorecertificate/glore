import { use } from 'react'

import { getTranslations } from 'next-intl/server'

import { ErrorView } from '@/components/layout/error-view'
import { SuspenseLayout } from '@/components/layout/suspense-layout'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { getCurrentUser } from '@/lib/data/server'

const resolveNotFoundContent = async () => {
  const [t, user] = await Promise.all([getTranslations('Common'), getCurrentUser()])
  const message = user ? t('backToHome') : t('accessApp')

  return { message }
}

const NotFoundContent = () => {
  const { message } = use(resolveNotFoundContent())

  return (
    <ErrorView className="min-h-screen" type="not-found">
      <Button asChild size="lg" variant="outline">
        <Link href="/">{message}</Link>
      </Button>
    </ErrorView>
  )
}

export default () => (
  <SuspenseLayout size="full">
    <NotFoundContent />
  </SuspenseLayout>
)
