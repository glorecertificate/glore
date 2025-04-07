'use client'

import { useMemo } from 'react'

import { motion, type AnimationProps, type Variants } from 'framer-motion'
import { useTranslations } from 'next-intl'

import { Image } from '@/components/ui/image'
import { Link } from '@/components/ui/link'
import { Logo } from '@/components/ui/logo'
import { Path } from '@/lib/navigation'
import { Asset } from '@/lib/storage'
import { cn } from '@/lib/utils'
import app from 'config/app.json'

const variants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.5,
      duration: 0.8,
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

  const ErrorImage = useMemo(
    () =>
      image ? (
        <Image src={image} width={300} />
      ) : type === 'not-found' ? (
        <Image priority src={Asset.NotFound} width={360} />
      ) : (
        <Image priority src={Asset.Error} width={240} />
      ),
    [image, type],
  )
  const errorMessage = useMemo(
    () =>
      message ||
      (type === 'not-found'
        ? t('notFoundMessage')
        : t.rich('errorMessage', {
            contactUs: content => (
              <a className="text-primary underline" href={`mailto:${app.email}`}>
                {content}
              </a>
            ),
          })),
    [message, t, type],
  )
  const errorTitle = useMemo(() => title || (type === 'not-found' ? t('notFound') : t('errorTitle')), [t, title, type])

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-start bg-background px-4 py-12',
        hasHeader ? 'min-h-screen' : 'min-h-[calc(100vh-4rem)]',
      )}
    >
      {hasHeader && (
        <Link href={Path.Home} title={t('backToHome')}>
          <Logo className="h-10" />
        </Link>
      )}
      <div className="relative flex w-full grow flex-col items-center justify-center gap-12">
        {ErrorImage}
        <motion.div animate="animate" className="text-center" initial="initial" variants={variants}>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground">{errorTitle}</h2>
          <p className="mb-8 text-base text-foreground/75">{errorMessage}</p>
          <div className="flex justify-center gap-4">{Actions}</div>
        </motion.div>
      </div>
    </div>
  )
}
