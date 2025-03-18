'use client'

import Link from 'next/link'

import { motion, type AnimationProps, type Variants } from 'framer-motion'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Image } from '@/components/ui/image'
import { Logo } from '@/components/ui/logo'
import { Route } from '@/lib/routes'
import { Asset } from '@/lib/storage'

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

export interface AppErrorProps {
  action?: () => void
  actionLabel?: React.ReactNode
  asset?: Asset
  assetWidth?: number
  message?: React.ReactNode
  title: React.ReactNode
}

export interface ErrorProps {
  error: { digest?: string } & Error
  reset: () => void
}

export default ({ action, actionLabel, asset = Asset.Error, assetWidth, message, title }: AppErrorProps) => {
  const t = useTranslations('Common')

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-background px-4 py-12">
      <Link href={Route.Dashboard}>
        <Logo className="h-10" />
      </Link>
      <div className="relative flex w-full grow flex-col items-center justify-center gap-12">
        <Image priority={false} src={asset} width={assetWidth} />
        <motion.div animate="animate" className="text-center" initial="initial" variants={variants}>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">{title}</h1>
          {message && <p className="mb-8 text-lg text-foreground/75">{message}</p>}
          <div className="flex justify-center gap-4">
            {action && (
              <Button onClick={action} size="lg" variant="outline">
                {actionLabel}
              </Button>
            )}
            <Button asChild size="lg" variant="outline">
              <Link href={Route.Dashboard}>{t('backToDashboard')}</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
