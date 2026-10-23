'use client'

import dynamic from 'next/dynamic'
import { useLayoutEffect } from 'react'

import { useTranslations } from 'next-intl'

import { ErrorIcon } from '@/components/icons/error'
import { appTitle } from '@/lib/metadata'
import { cn } from '@/lib/utils'
import metadata from '~/config/metadata.json'

const NotFoundIcon = dynamic(async () => (await import('@/components/icons/not-found')).NotFoundIcon, {
  loading: () => <div className="mb-8 aspect-659/357 w-80 sm:w-90" />,
  ssr: false,
})

export interface ErrorProps {
  error: { digest?: string } & Error
  reset: () => void
}

export const ErrorFallback = ({
  children,
  className,
  message,
  title,
  type = 'error',
  ...props
}: React.HTMLAttributes<HTMLDivElement> &
  React.HTMLAttributes<HTMLDivElement> & {
    message?: string
    type?: 'error' | 'not-found'
  }) => {
  const t = useTranslations('Common')

  const errorTitle = title ?? (type === 'not-found' ? t('notFound') : t('errorTitle'))
  useLayoutEffect(() => {
    const documentTitle = appTitle(errorTitle)
    const apply = () => {
      if (document.title !== documentTitle) document.title = documentTitle
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.head, { characterData: true, childList: true, subtree: true })
    return () => observer.disconnect()
  }, [errorTitle])

  const errorMessage = (() => {
    if (message) return message
    return type === 'not-found'
      ? t('notFoundMessage')
      : t.rich('errorMessage', {
          contactUs: content => (
            <a className="text-brand-text underline" href={`mailto:${metadata.email}`}>
              {content}
            </a>
          ),
        })
  })()

  return (
    <div
      className={cn('flex h-full flex-col items-center justify-start bg-background px-4 py-12 text-center', className)}
      {...props}
    >
      <div className="relative flex w-full grow flex-col items-center justify-center gap-6">
        {type === 'not-found' ? <NotFoundIcon className="mb-8 w-80 sm:w-90" /> : <ErrorIcon className="w-40 sm:w-45" />}
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground">{errorTitle}</h2>
          <p className="mb-8 text-base text-foreground/75">{errorMessage}</p>
          <div className="flex justify-center gap-4">{children}</div>
        </div>
      </div>
    </div>
  )
}
