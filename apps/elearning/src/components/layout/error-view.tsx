'use client'

import { useMemo } from 'react'

import { motion, type AnimationProps, type Variants } from 'framer-motion'
import { useTranslations } from 'next-intl'

import { Image } from '@/components/ui/image'
import { Link } from '@/components/ui/link'
import { Logo } from '@/components/ui/logo'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { Route } from '@/lib/navigation'
import { Asset } from '@/lib/storage'
import { cn } from '@/lib/utils'
import metadata from 'config/metadata.json'

const variants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.25,
      duration: 0.5,
    },
  },
} satisfies AnimationProps

export interface ErrorProps {
  error: { digest?: string } & Error
  reset: () => void
}

export interface ErrorViewProps {
  Actions?: React.ReactNode
  hasHeader?: boolean
  image?: Asset
  message?: string
  title?: string
  type?: 'error' | 'not-found'
}

export const ErrorView = ({ Actions, hasHeader, image, message, title, type = 'error' }: ErrorViewProps) => {
  const t = useTranslations('Common')
  const isMobile = useIsMobile()

  const ErrorImage = useMemo(
    () =>
      image ? (
        <Image src={image} width={300} />
      ) : type === 'not-found' ? (
        <Image priority src={Asset.NotFound} width={isMobile ? 320 : 360} />
      ) : (
        <Image priority src={Asset.Error} width={isMobile ? 200 : 220} />
      ),
    [image, isMobile, type],
  )
  const errorMessage = useMemo(
    () =>
      message ||
      (type === 'not-found'
        ? t('notFoundMessage')
        : t.rich('errorMessage', {
            contactUs: content => (
              <a className="text-primary underline" href={`mailto:${metadata.email}`}>
                {content}
              </a>
            ),
          })),
    [message, t, type],
  )
  const errorTitle = useMemo(() => title || (type === 'not-found' ? t('notFound') : t('errorTitle')), [t, title, type])

  return (
    <>
      {hasHeader && (
        <header className="flex h-16 w-full items-center justify-center px-4">
          <Link href={Route.Home} title={t('backToHome')}>
            <Logo className="mt-8 h-10" />
          </Link>
        </header>
      )}
      <motion.div
        animate="animate"
        className={cn(
          'flex flex-col items-center justify-start bg-background px-4 py-12 text-center',
          hasHeader ? 'min-h-[calc(100vh-4rem)]' : 'min-h-screen',
        )}
        initial="initial"
        variants={variants}
      >
        <div className="relative flex w-full grow flex-col items-center justify-center gap-6">
          {ErrorImage}
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground">{errorTitle}</h2>
            <p className="mb-8 text-base text-foreground/75">{errorMessage}</p>
            <div className="flex justify-center gap-4">{Actions}</div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
