'use client'

import { type Route } from 'next'

import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Globe, type GlobeColorOptions } from '@/components/ui/globe'
import { Link } from '@/components/ui/link'
import { PageHeader, PageHeaderActions, PageHeaderDescription, PageHeaderHeading } from '@/components/ui/page-header'
import { useTheme } from '@/hooks/use-theme'
import { hexToRgb } from '@/lib/utils'
import theme from '~/config/theme.json'

export const DashboardHero = ({
  action,
  organization,
  subtitle,
  title,
}: {
  action?: { href: Route; label: string }
  organization: string | null
  subtitle: string
  title: string
}) => {
  const { resolvedTheme } = useTheme()

  const colors = hexToRgb(theme.colors[resolvedTheme ?? 'light'])
  const globeColors: GlobeColorOptions = {
    baseColor: [colors.brand, colors.brandSecondary, colors.brandTertiary],
    glowColor: colors.background,
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border-subtle bg-card bg-linear-to-br from-brand/12 via-card to-brand-secondary/10 p-6 shadow-card sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-20 opacity-25 select-none sm:-top-28 sm:-right-24 sm:opacity-30"
      >
        <Globe className="size-80 sm:size-112" devicePixelRatio={0.5} {...globeColors} />
      </div>
      <PageHeader className="relative z-10 gap-5 sm:items-center">
        <PageHeaderHeading>
          <h2 className="type-title text-balance text-foreground">{title}</h2>
          <PageHeaderDescription>{subtitle}</PageHeaderDescription>
          {organization && (
            <p className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
              <LucideIcon className="size-3.5 shrink-0" name="building-2" />
              <span className="truncate">{organization}</span>
            </p>
          )}
        </PageHeaderHeading>
        {action && (
          <PageHeaderActions>
            <Button asChild variant="brand">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          </PageHeaderActions>
        )}
      </PageHeader>
    </section>
  )
}
