'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useTranslations } from 'next-intl'

import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Link } from '@/components/ui/link'
import { Logo } from '@/components/ui/logo'
import { SIDEBAR_KEYBOARD_SHORTCUT, SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useHeader } from '@/hooks/use-header'
import { usePathname } from '@/hooks/use-pathname'
import { Route } from '@/lib/navigation'
import { cn } from '@/lib/utils'

export const AppHeader = ({ className, ...props }: React.ComponentPropsWithRef<'header'>) => {
  const { breadcrumb, hasShadow, subHeader } = useHeader()
  const pathname = usePathname()
  const { open } = useSidebar()
  const t = useTranslations()

  const [isScrolled, setIsScrolled] = useState(false)
  const sidebarAction = useMemo(() => (open ? t('Common.sidebarClose') : t('Common.sidebarOpen')), [open, t])

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
    <>
      <header
        className={cn(
          'ml-[1px] min-h-16 shrink-0 gap-2 bg-background transition-[width,height] ease-linear',
          hasShadow && isScrolled && 'border-b',
          className,
        )}
        {...props}
      >
        <div className="flex w-full shrink-0 items-center justify-between gap-2 px-4 py-2">
          <div className="flex h-10 grow items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarTrigger
                  className={cn(
                    '-ml-1 [&_svg]:size-[18px] [&_svg]:stroke-foreground/64 [&_svg]:text-foreground/64',
                    open && '[&_svg]:size-5',
                  )}
                />
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs font-medium">{sidebarAction}</p>
                <p className="font-mono text-[10px] text-gray-400 dark:text-gray-500">{`Ctrl + ${SIDEBAR_KEYBOARD_SHORTCUT.toUpperCase()}`}</p>
              </TooltipContent>
            </Tooltip>
            {breadcrumb && <Breadcrumb className="ml-1 flex h-full items-center">{breadcrumb}</Breadcrumb>}
          </div>
          <Link
            className={cn('mr-2', pathname === Route.Home && 'pointer-events-none')}
            href={Route.Home}
            title={t('Navigation.goToDashboard')}
          >
            <Logo className="transition-[width,height]" height={20} />
          </Link>
        </div>
        {subHeader && <div className="container mx-auto bg-background px-8 pt-1 pb-5">{subHeader}</div>}
      </header>
    </>
  )
}
