'use client'

import { useTranslations } from 'next-intl'

import { ErrorIcon } from '@/components/icons/error'
import { Image } from '@/components/ui/image'
import { cn, publicFile } from '@/lib/utils'
import metadata from '~/config/metadata.json'

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
  const errorMessage = (() => {
    if (message) return message
    return type === 'not-found'
      ? t('notFoundMessage')
      : t.rich('errorMessage', {
          contactUs: content => (
            <a className="text-brand underline" href={`mailto:${metadata.email}`}>
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
        {type === 'not-found' ? (
          <Image className="mb-8 w-80 sm:w-90" draggable={false} preload src={publicFile('/assets/not-found.svg')} />
        ) : (
          <ErrorIcon className="w-40 sm:w-45" />
        )}
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground">{errorTitle}</h2>
          <p className="mb-8 text-base text-foreground/75">{errorMessage}</p>
          <div className="flex justify-center gap-4">{children}</div>
        </div>
      </div>
    </div>
  )
}
