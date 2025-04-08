'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useTranslations } from 'next-intl'

import { AppLink } from '@/components/layout/app-link'
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
import { Path } from '@/lib/navigation'
import { cn } from '@/lib/utils'

export const AppHeader = ({ className, ...props }: React.ComponentPropsWithRef<'header'>) => {
  const isMobile = useIsMobile()
  const { route, routes } = useNavigation()
  const { open } = useSidebar()
  const t = useTranslations()

  const hasBreadcrumb = useMemo(() => route.breadcrumb !== false, [route.breadcrumb])
  const parentRoute = useMemo(
    () =>
      routes.find(({ path }) => {
        if (path === Path.Home || path === route.path) return false
        if (path.slice(1).split('/').length > 1) return false
        return route.path.startsWith(path)
      }),
    [route.path, routes],
  )
  const currentRoute = useMemo(
    () => ({
      ...route,
      title: route.title || document.title.match(/^([\w\s]+) \W/)?.[1] || parentRoute?.title,
    }),
    [parentRoute?.title, route],
  )
  const logoSize = useMemo(() => (!open || isMobile ? 20 : 24), [isMobile, open])
  const sidebarAction = useMemo(() => (open ? t('Common.sidebarClose') : t('Common.sidebarOpen')), [open, t])
  // const pageIconClass = useMemo(() => {
  //   if (!route.color) return ''
  //   if (route.color === 'muted') return 'text-muted-foreground'
  //   return `text-${route.color}`
  // }, [route?.color])

  const [isScrolled, setIsScrolled] = useState(false)

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

          {hasBreadcrumb && (
            <Breadcrumb className="ml-1 flex h-full items-center">
              <BreadcrumbList>
                {parentRoute && (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbButton
                        className={cn(parentRoute?.color && `hover:text-${parentRoute.color}`)}
                        to={parentRoute.path}
                      >
                        {/* {parentRoute?.icon && <parentRoute.icon className={pageIconClass} size={20} />} */}
                        {parentRoute?.title}
                      </BreadcrumbButton>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </>
                )}
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {/* {currentRoute.icon && <currentRoute.icon className={pageIconClass} size={20} />} */}
                    {currentRoute?.title}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>
        <AppLink
          className={cn('mr-2', currentRoute?.path === Path.Home && 'pointer-events-none')}
          title={t('Navigation.goToDashboard')}
          to={Path.Home}
        >
          <Logo height={logoSize} />
        </AppLink>
      </div>
    </header>
  )
}
