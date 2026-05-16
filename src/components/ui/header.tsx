'use client'

import { Route } from 'next'
import { usePathname, useSearchParams } from 'next/navigation'

import { InfoIcon } from 'lucide-react'

import { Breadcrumb, BreadcrumbItem, BreadcrumbList } from '@/components/ui/breadcrumb'
import { Link, LinkProps } from '@/components/ui/link'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useScroll } from '@/hooks/use-scroll'
import { cn } from '@/lib/utils'
import settings from '~/config/app.json'

export const HeaderTrigger = ({ className, ...props }: React.ComponentProps<typeof SidebarTrigger>) => {
  const { action } = useSidebar()

  return (
    <Tooltip delayDuration={600} disableHoverableContent>
      <TooltipTrigger asChild>
        <SidebarTrigger className={cn('-ml-1', className)} {...props} />
      </TooltipTrigger>
      <TooltipContent showArrow side="right">
        <p className="text-xs font-medium">{action}</p>
        <p className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">{`⌘ + ${settings.sidebarShortcut.toUpperCase()}`}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export const HeaderBreadcrumb = ({
  backHref,
  children,
  description,
  title,
  ...props
}: React.ComponentProps<typeof Breadcrumb> & {
  backHref?: Route
  description?: React.ReactNode
  title?: React.ReactNode
}) => {
  if (!(title || description)) {
    return (
      <Breadcrumb {...props}>
        <BreadcrumbList className="grow justify-between sm:gap-4">{children}</BreadcrumbList>
      </Breadcrumb>
    )
  }

  return (
    <Breadcrumb {...props}>
      <BreadcrumbList className="h-9 grow justify-between sm:gap-3">
        <BreadcrumbItem className="gap-2">
          {title &&
            (backHref ? (
              <Link
                className="text-[15px] text-muted-foreground/80 hover:text-foreground dark:text-foreground/80"
                href={backHref}
              >
                {title}
              </Link>
            ) : (
              <span className="text-[15px] text-foreground">{title}</span>
            ))}
          {description && (
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="mt-0.5 size-3.5 cursor-help text-foreground/60 not-data-[state=closed]:text-foreground hover:text-foreground" />
              </TooltipTrigger>
              <TooltipContent className="text-[13px]" showArrow>
                {description}
              </TooltipContent>
            </Tooltip>
          )}
        </BreadcrumbItem>
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
      className={cn(href === pathname && !searchParams.toString() && 'pointer-events-none')}
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
        'sticky top-0 z-5 flex min-h-12 w-full shrink-0 items-center justify-between gap-2 px-6 py-4',
        'border-b border-header-border bg-header text-header-foreground transition-[width,height] ease-linear',
        scrolled && 'border-header-border',
        className
      )}
      {...props}
    >
      {children}
    </header>
  )
}
