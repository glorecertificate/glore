'use client'

import Link from 'next/link'

import { motion, type AnimationProps, type Variants } from 'framer-motion'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Image } from '@/components/ui/image'
import { LogoFull } from '@/components/ui/logo'
import { Route } from '@/lib/routes'
import { Asset } from '@/lib/storage'

const contentVariants: AnimationProps = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.5,
      duration: 0.8,
    },
  },
}

export default () => {
  const t = useTranslations('Common')

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-background px-4 py-12">
      <Link href={Route.Dashboard}>
        <LogoFull className="h-10" />
      </Link>
      <div className="relative flex w-full max-w-md grow flex-col justify-center gap-12">
        <Image src={Asset.NotFound} width={400} />
        <motion.div animate="animate" className="max-w-md text-center" initial="initial" variants={contentVariants as Variants}>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">{t('notFound')}</h1>
          <p className="mb-8 text-lg text-muted-foreground">{t('notFoundMessage')}</p>
          <Button asChild size="lg" variant="outline">
            <Link href="/">{t('notFoundAction')}</Link>
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
