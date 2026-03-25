import { getTranslations } from 'next-intl/server'

import { getAuthUser } from '@/actions/auth'
import { ErrorFallback } from '@/components/layout/error-fallback'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { APP_ROOT, AUTH_ROOT } from '@/lib/constants'

export default async () => {
  const [user, t] = await Promise.all([getAuthUser(), getTranslations('Common')])
  const message = user ? t('backToHome') : t('accessApp')
  const link = user ? APP_ROOT : AUTH_ROOT

  return (
    <ErrorFallback className="min-h-screen" type="not-found">
      <Button asChild size="lg" variant="outline">
        <Link href={link}>{message}</Link>
      </Button>
    </ErrorFallback>
  )
}
