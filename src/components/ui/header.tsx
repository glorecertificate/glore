'use client'

import { Route } from 'next'
import { usePathname, useSearchParams } from 'next/navigation'

import { LucideIcon } from '@/components/icons/lucide'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Link, LinkProps } from '@/components/ui/link'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useModifierKey } from '@/hooks/use-modifier-key'
import { useScroll } from '@/hooks/use-scroll'
import { cn } from '@/lib/utils'
import settings from '~/config/app.json'
import metadata from '~/config/metadata.json'

export const HeaderTrigger = ({ className, ...props }: React.ComponentProps<typeof SidebarTrigger>) => {
  const { action } = useSidebar()
  const modifierKey = useModifierKey()

  return (
    <Tooltip delayDuration={600} disableHoverableContent>
      <TooltipTrigger asChild>
        <SidebarTrigger className={cn('-ml-1', className)} {...props} />
      </TooltipTrigger>
      <TooltipContent className="flex items-center gap-2" showArrow side="right">
        <span className="text-xs font-medium">{action}</span>
        <KbdGroup>
          <Kbd>{modifierKey}</Kbd>
          <Kbd>{settings.sidebarShortcut.toUpperCase()}</Kbd>
        </KbdGroup>
      </TooltipContent>
    </Tooltip>
  )
}

const BAR_TEXT = 'font-sans text-[15px] tracking-normal'

export const HeaderBreadcrumb = ({
  backHref,
  backLabel,
  children,
  description,
  title,
  ...props
}: Omit<React.ComponentProps<typeof Breadcrumb>, 'title'> & {
  backHref?: Route
  backLabel?: React.ReactNode
  description?: React.ReactNode
  title?: React.ReactNode
}) => {
  if (!(title || description || backHref)) {
    return (
      <Breadcrumb {...props}>
        <BreadcrumbList className="grow justify-between sm:gap-4">{children}</BreadcrumbList>
      </Breadcrumb>
    )
  }

  return (
    <Breadcrumb {...props}>
      <BreadcrumbList className="h-9 min-w-0 grow flex-nowrap gap-1.5 sm:gap-2">
        {backHref && (
          <BreadcrumbItem className="shrink-0">
            <Link
              className={cn(
                BAR_TEXT,
                'font-normal text-muted-foreground hover:text-foreground dark:text-foreground/80'
              )}
              href={backHref}
            >
              {backLabel}
            </Link>
          </BreadcrumbItem>
        )}
        {backHref && title && <BreadcrumbSeparator />}
        {(title || description) && (
          <BreadcrumbItem className="min-w-0 gap-2">
            {title &&
              (backHref ? (
                <BreadcrumbPage className={cn(BAR_TEXT, 'truncate font-medium')}>{title}</BreadcrumbPage>
              ) : (
                <h1 className={cn(BAR_TEXT, 'font-medium text-foreground')}>{title}</h1>
              ))}
            {description && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <LucideIcon
                    name="info"
                    className="mt-px size-3.5 cursor-help text-foreground/60 not-data-[state=closed]:text-foreground hover:text-foreground"
                  />
                </TooltipTrigger>
                <TooltipContent className="text-[13px]" showArrow>
                  {description}
                </TooltipContent>
              </Tooltip>
            )}
          </BreadcrumbItem>
        )}
        {children}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export const HeaderLogo = <T,>({ className, href, ...props }: LinkProps<T>) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <Link
      aria-label={metadata.name}
      className={cn(href === pathname && !searchParams.toString() && 'pointer-events-none', className)}
      href={href}
      {...props}
    />
  )
}

export const Header = ({ children, className, ...props }: React.ComponentProps<'header'>) => {
  const { scrolled } = useScroll()

  return (
    <header
      className={cn(
        'sticky top-0 z-5 w-full shrink-0 border-b border-transparent bg-header text-header-foreground transition-[width,height] ease-linear',
        scrolled && 'border-header-border'
      )}
      {...props}
    >
      <div
        className={cn(
          'mx-auto flex min-h-12 w-full max-w-420 items-center justify-between gap-2 px-page py-4',
          className
        )}
        data-slot="header-content"
      >
        {children}
      </div>
    </header>
  )
}
