'use client'

import { type Route } from 'next'
import dynamic from 'next/dynamic'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { type GlobeColorOptions } from '@/components/ui/globe'
import { Link } from '@/components/ui/link'
import { useTheme } from '@/hooks/use-theme'
import { hexToRgb } from '@/lib/utils'
import theme from '~/config/theme.json'

const Globe = dynamic(async () => (await import('@/components/ui/globe')).Globe, { ssr: false })

export const DashboardHero = ({
  action,
  name,
  organization,
  subtitle,
}: {
  action?: { href: Route; label: string }
  name: string
  organization: string | null
  subtitle: string
}) => {
  const { resolvedTheme } = useTheme()
  const t = useTranslations('Dashboard')

  const colors = hexToRgb(theme.colors[resolvedTheme ?? 'light'])
  const globeColors: GlobeColorOptions = {
    baseColor: [colors.brand, colors.brandSecondary, colors.brandTertiary],
    glowColor: colors.background,
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-brand/10 via-card to-brand-secondary/8 p-6 shadow-2xs sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-20 opacity-25 select-none sm:-top-28 sm:-right-24 sm:opacity-30"
      >
        <Globe className="size-80 sm:size-112" {...globeColors} />
      </div>
      <div className="relative z-10 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">{t('greeting', { name })}</h1>
          <p className="text-[15px] text-muted-foreground">
            {subtitle}
            {organization && (
              <span className="text-foreground/60 before:mx-1.5 before:content-['·']">{organization}</span>
            )}
          </p>
        </div>
        {action && (
          <Button asChild className="shrink-0" variant="brand">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        )}
      </div>
    </section>
  )
}
