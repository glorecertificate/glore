'use client'

import { useTranslations } from '@repo/i18n'
import { Button } from '@repo/ui/components/button'

import { ErrorView } from '@/components/layout/error-view'
import { Link } from '@/components/ui/link'
import { useHeader } from '@/hooks/use-header'

export default () => {
  const t = useTranslations('Courses')

  useHeader({ shadow: false })

  return (
    <ErrorView message={t('notFoundMessage')} title={t('notFound')} type="not-found">
      <Button asChild size="lg" variant="outline">
        <Link href="/courses">{t('backTo')}</Link>
      </Button>
    </ErrorView>
  )
}
