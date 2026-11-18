import { getTranslations } from 'next-intl/server'

import { getAuthUser } from '@/actions/auth'
import { BrandShell } from '@/components/features/auth/brand-shell'
import { DynamicMarker } from '@/components/layout/dynamic-marker'
import { ErrorFallback } from '@/components/layout/error-fallback'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { APP_ROOT, AUTH_ROOT } from '@/lib/constants'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({ namespace: 'Common', title: 'notFound' })

const AppNotFound = async () => {
  const [user, t] = await Promise.all([getAuthUser(), getTranslations('Common')])
  const message = user ? t('backToHome') : t('accessApp')
  const link = user ? APP_ROOT : AUTH_ROOT

  return (
    <>
      <BrandShell>
        <Card className="p-0">
          <ErrorFallback className="min-h-0 bg-transparent py-12" type="not-found">
            <Button asChild size="lg" variant="outline">
              <Link href={link}>{message}</Link>
            </Button>
          </ErrorFallback>
        </Card>
      </BrandShell>
      <DynamicMarker />
    </>
  )
}

export default AppNotFound
