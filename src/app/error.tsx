'use client'

import { useTranslations } from 'next-intl'

import { ErrorActions } from '@/components/layout/error-actions'
import { ErrorFallback, type ErrorProps } from '@/components/layout/error-fallback'
import { Link } from '@/components/ui/link'
import { Logo } from '@/components/ui/logo'
import { APP_ROOT } from '@/lib/constants'

const AppError = (props: ErrorProps) => {
  const t = useTranslations('Common')

  return (
    <>
      <header className="flex h-16 w-full items-center justify-center px-4">
        <Link href={APP_ROOT} title={t('backToHome')}>
          <Logo className="mt-8 h-8" />
        </Link>
      </header>
      <ErrorFallback className="min-h-[calc(100vh-4rem)]">
        <ErrorActions {...props} />
      </ErrorFallback>
    </>
  )
}

export default AppError
