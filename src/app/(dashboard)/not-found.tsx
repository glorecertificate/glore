import { getTranslations } from 'next-intl/server'

import { DashboardHeader } from '@/components/layout/dashboard-header'
import { ErrorFallback } from '@/components/layout/error-fallback'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Main } from '@/components/ui/main'
import { APP_ROOT } from '@/lib/constants'

const DashboardNotFound = async () => {
  const t = await getTranslations('Common')

  return (
    <>
      <DashboardHeader />
      <Main>
        <ErrorFallback className="flex-1" type="not-found">
          <Button asChild size="lg" variant="outline">
            <Link href={APP_ROOT}>{t('backToHome')}</Link>
          </Button>
        </ErrorFallback>
      </Main>
    </>
  )
}

export default DashboardNotFound
