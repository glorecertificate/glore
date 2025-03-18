'use client'

import Link from 'next/link'

import { motion, type AnimationProps, type Variants } from 'framer-motion'

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
  actionLabel: React.ReactNode
  actionUrl?: Route
  asset?: Asset
  message?: React.ReactNode
  title: React.ReactNode
}

export interface ErrorProps {
  error: { digest?: string } & Error
  reset: () => void
}

export default ({ action, actionLabel, actionUrl = Route.Dashboard, asset = Asset.Error, message, title }: AppErrorProps) => (
  <div className="flex min-h-screen flex-col items-center justify-start bg-background px-4 py-12">
    <Link href={Route.Dashboard}>
      <Logo className="h-10" full />
    </Link>
    <div className="relative flex w-full max-w-md grow flex-col justify-center gap-12 px-4">
      <Image src={asset} />
      <motion.div animate="animate" className="max-w-md text-center" initial="initial" variants={variants}>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">{title}</h1>
        {message && <p className="mb-8 text-lg text-muted-foreground">{message}</p>}
        {action ? (
          <Button asChild onClick={action} size="lg" variant="outline">
            {actionLabel}
          </Button>
        ) : (
          <Button asChild size="lg" variant="outline">
            <Link href={actionUrl}>{actionLabel}</Link>
          </Button>
        )}
      </motion.div>
    </div>
  </div>
)
