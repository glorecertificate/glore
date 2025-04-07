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
  const { sections } = useNavigation()
  const { open } = useSidebar()
  const t = useTranslations()

  const [isScrolled, setIsScrolled] = useState(false)

  const pages = useMemo(() => sections.flatMap(section => section.pages), [sections])
  const page = useMemo(() => pages.find(page => page.isActiveSection), [pages])
  const subPage = useMemo(() => pages.flatMap(page => page.subPages).find(subPage => subPage.isActive), [pages])
  const isHomePage = useMemo(() => page?.path === Route.Home, [page])
  const logoSize = useMemo(() => (!open || isMobile ? 20 : 24), [isMobile, open])
  const pageUrl = useMemo(() => (subPage ? page?.path : undefined) as Route, [page, subPage])
  const sidebarAction = useMemo(() => (open ? t('Common.sidebarClose') : t('Common.sidebarOpen')), [open, t])
  const pageIconClass = useMemo(() => {
    if (!page?.color) return ''
    if (page.color === 'muted') return 'text-muted-foreground'
    return `text-${page.color}`
  }, [page?.color])

  const onWindowScroll = useCallback(() => {
    const scroll =
      window.pageYOffset !== undefined
        ? window.pageYOffset
        : (document.documentElement || document.body.parentNode || document.body).scrollTop
    setIsScrolled(scroll > 0)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', onWindowScroll)
    return () => {
      window.removeEventListener('scroll', onWindowScroll)
    }
  }, [onWindowScroll])

  return (
    <header
      className={cn(
        'ml-[1px] flex h-16 shrink-0 items-center gap-2 bg-background transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-14',
        isScrolled && 'border-b shadow',
        className,
      )}
      {...props}
    >
      <div className="flex w-full items-center justify-between gap-2 px-4">
        <div className="flex h-10 grow items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarTrigger className="-ml-1 [&_svg]:stroke-foreground/64 [&_svg]:text-foreground/64" />
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs font-medium">{sidebarAction}</p>
              <p className="font-mono text-[10px] text-gray-400 dark:text-gray-500">{`Ctrl + ${SIDEBAR_KEYBOARD_SHORTCUT.toUpperCase()}`}</p>
            </TooltipContent>
          </Tooltip>

          {!isHomePage && (
            <Breadcrumb className="ml-1 flex h-full items-center">
              <BreadcrumbList>
                <BreadcrumbItem>
                  {subPage ? (
                    <BreadcrumbButton className={cn(page?.color && `hover:text-${page.color}`)} to={pageUrl}>
                      {page?.icon && <page.icon className={pageIconClass} size={20} />}
                      {page?.title}
                    </BreadcrumbButton>
                  ) : (
                    <BreadcrumbPage>
                      {page?.icon && <page.icon className={pageIconClass} size={20} />}
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
          className={cn('mr-2', page?.path === Route.Home && 'pointer-events-none')}
          title={t('Navigation.goToDashboard')}
          to={Route.Home}
        >
          <Logo height={logoSize} />
        </DashboardLink>
      </div>
    </header>
  )
}
