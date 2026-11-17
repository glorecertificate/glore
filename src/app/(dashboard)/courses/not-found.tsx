'use client'

import { useTranslations } from 'next-intl'

import { DashboardHeader } from '@/components/layout/dashboard-header'
import { ErrorFallback } from '@/components/layout/error-fallback'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Main } from '@/components/ui/main'

const CoursesNotFound = () => {
  const t = useTranslations('CourseList')

  return (
    <>
      <DashboardHeader parent="courses" />
      <Main>
        <ErrorFallback message={t('notFoundMessage')} title={t('notFound')} className="flex-1" type="not-found">
          <Button asChild size="lg" variant="outline">
            <Link href="/courses">{t('backTo')}</Link>
          </Button>
        </ErrorFallback>
      </Main>
    </>
  )
}

export default CoursesNotFound
