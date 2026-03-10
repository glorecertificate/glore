'use client'

import { Route } from 'next'
import { usePathname, useSearchParams } from 'next/navigation'

import { InfoIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { GloreIcon } from '@/components/icons/glore'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList } from '@/components/ui/breadcrumb'
import { Link } from '@/components/ui/link'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useScroll } from '@/hooks/use-scroll'
import { APP_ROOT } from '@/lib/constants'
import { type MessageKey, type Namespace } from '@/lib/i18n'
import { type Any, type IconProps } from '@/lib/types'
import { cn } from '@/lib/utils'
import settings from '~/config/app.json'

export const PageHeaderSidebarTrigger = ({ className, ...props }: React.ComponentProps<typeof SidebarTrigger>) => {
  const { action } = useSidebar()

  return (
    <Tooltip delayDuration={600} disableHoverableContent>
      <TooltipTrigger asChild>
        <SidebarTrigger className={cn('-ml-1', className)} {...props} />
      </TooltipTrigger>
      <TooltipContent showArrow side="right">
        <p className="text-xs font-medium">{action}</p>
        <p className="font-mono text-[10px] text-gray-400 dark:text-gray-500">{`Ctrl + ${settings.sidebarShortcut.toUpperCase()}`}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export const PageHeaderBreadcrumb = <T extends Namespace>({
  children,
  descriptionKey,
  href,
  namespace,
  titleKey,
  ...props
}: React.ComponentProps<typeof Breadcrumb> & {
  descriptionKey?: MessageKey<T>
  href?: Route
  namespace?: T
  titleKey?: MessageKey<T>
}) => {
  const t = useTranslations(namespace) as Any

  if (!(titleKey || descriptionKey)) {
    return (
      <Breadcrumb {...props}>
        <BreadcrumbList className="grow justify-between sm:gap-4">{children}</BreadcrumbList>
      </Breadcrumb>
    )
  }

  return (
    <Breadcrumb {...props}>
      <BreadcrumbList className="h-9 grow justify-between sm:gap-2.5">
        <BreadcrumbItem>
          {titleKey &&
            (href ? (
              <Link
                className="text-[15px] text-muted-foreground/80 hover:text-foreground dark:text-foreground/80"
                href={href}
              >
                {t(titleKey)}
              </Link>
            ) : (
              <span className="text-[15px] text-foreground">{t(titleKey)}</span>
            ))}
          {descriptionKey && (
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="mt-0.5 size-3.5 cursor-help text-foreground/60" />
              </TooltipTrigger>
              <TooltipContent className="text-[13px]" showArrow>
                {t(descriptionKey)}
              </TooltipContent>
            </Tooltip>
          )}
        </BreadcrumbItem>
        {children}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export const PageHeaderLogo = ({ className, ...props }: IconProps) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isRoot = pathname === APP_ROOT && !searchParams.toString()

  return (
    <Link className={cn(isRoot && 'pointer-events-none')} href={APP_ROOT}>
      <GloreIcon className={cn('mr-1 w-18 transition-[width,height]', className)} {...props} />
    </Link>
  )
}

export const PageHeaderContainer = ({ children, className, ...props }: React.ComponentProps<'header'>) => {
  const { scrolled } = useScroll()

  return (
    <header
      className={cn(
        'sticky top-0 z-5 ml-px flex min-h-12 w-full shrink-0 items-center justify-between gap-2 p-4',
        'bg-linear-to-tr from-background to-background/90 transition-[width,height] ease-linear',
        scrolled && 'border-b',
        className
      )}
      {...props}
    >
      {children}
    </header>
  )
}

export const PageHeader = (props: React.ComponentProps<typeof PageHeaderBreadcrumb>) => (
  <PageHeaderContainer className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <PageHeaderSidebarTrigger />
      <PageHeaderBreadcrumb {...props} />
    </div>
    <PageHeaderLogo />
  </PageHeaderContainer>
)
