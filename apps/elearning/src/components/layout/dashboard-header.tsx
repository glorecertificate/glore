'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useTranslations } from 'next-intl'

import { DashboardLink } from '@/components/layout/dashboard-link'
import {
  Breadcrumb,
  BreadcrumbButton,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Logo } from '@/components/ui/logo'
import { SIDEBAR_KEYBOARD_SHORTCUT, SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { useNavigation } from '@/hooks/use-navigation'
import { Route } from '@/lib/navigation'
import { cn } from '@/lib/utils'

export const DashboardHeader = ({ className, ...props }: React.ComponentPropsWithRef<'header'>) => {
  const isMobile = useIsMobile()
  const { page, subPage } = useNavigation()
  const { open } = useSidebar()
  const t = useTranslations()

  const [isScrolled, setIsScrolled] = useState(false)

  const onScroll = useCallback(() => {
    const scroll =
      window.pageYOffset !== undefined
        ? window.pageYOffset
        : (document.documentElement || document.body.parentNode || document.body).scrollTop
    setIsScrolled(scroll > 0)
  }, [])

  const isHomePage = useMemo(() => page?.path === Route.Home, [page])
  const logoSize = useMemo(() => (!open || isMobile ? 20 : 24), [isMobile, open])
  const pageUrl = useMemo(() => (subPage ? page?.path : undefined) as Route, [page, subPage])
  const sidebarAction = useMemo(() => (open ? t('Common.sidebarClose') : t('Common.sidebarOpen')), [open, t])

  useEffect(() => {
    window.addEventListener('scroll', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [onScroll])

  return (
    <header
      className={cn(
        'ml-[1px] flex h-16 shrink-0 items-center gap-2 bg-background transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12',
        isScrolled && 'border-b shadow',
        className,
      )}
      {...props}
    >
      <div className="flex w-full items-center justify-between gap-2 px-4">
        <div className="flex grow items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarTrigger className="-ml-1 [&_svg:not([class*=text-])]:text-foreground/80" />
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs font-medium">{sidebarAction}</p>
              <p className="font-mono text-[10px] text-gray-400 dark:text-gray-500">{`Ctrl + ${SIDEBAR_KEYBOARD_SHORTCUT.toUpperCase()}`}</p>
            </TooltipContent>
          </Tooltip>

          {!isHomePage && (
            <Breadcrumb className="ml-1">
              <BreadcrumbList>
                <BreadcrumbItem>
                  {subPage ? (
                    <BreadcrumbButton className={cn(page?.color && `hover:text-${page.color}`)} to={pageUrl}>
                      {page?.Icon && <page.Icon className={cn(page?.color && `text-${page.color}`)} size={20} />}
                      {page?.title}
                    </BreadcrumbButton>
                  ) : (
                    <BreadcrumbPage>
                      {page?.Icon && <page.Icon className={cn(page?.color && `text-${page.color}`)} size={20} />}
                      {page?.title}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {subPage && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{subPage.title}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>
        <DashboardLink
          className={cn(page?.path === Route.Home && 'pointer-events-none')}
          title={t('Navigation.goToDashboard')}
          to={Route.Home}
        >
          <Logo className="mr-2" height={logoSize} />
        </DashboardLink>
      </div>
    </header>
  )
}
