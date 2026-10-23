import { getTranslations } from 'next-intl/server'

import { getAuthUser } from '@/actions/auth'
import { DynamicMarker } from '@/components/layout/dynamic-marker'
import { ErrorFallback } from '@/components/layout/error-fallback'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { APP_ROOT, AUTH_ROOT } from '@/lib/constants'
import { loadSettings } from '@/lib/settings'

const UserNotFound = async () => {
  const [user, t, tCommon, { website }] = await Promise.all([
    getAuthUser(),
    getTranslations('CertificatePublic'),
    getTranslations('Common'),
    loadSettings(),
  ])

  return (
    <>
      <ErrorFallback message={t('publicNotFoundMessage')} title={t('publicNotFound')} type="not-found">
        {user ? (
          <Button asChild>
            <Link href={APP_ROOT}>{tCommon('backToHome')}</Link>
          </Button>
        ) : (
          <>
            <Button asChild variant="outline">
              <a href={website} rel="noopener noreferrer" target="_blank">
                {t('publicJoinButton')}
              </a>
            </Button>
            <Button asChild>
              <Link href={AUTH_ROOT}>{t('publicAccessApp')}</Link>
            </Button>
          </>
        )}
      </ErrorFallback>
      <DynamicMarker />
    </>
  )
}

export default UserNotFound
