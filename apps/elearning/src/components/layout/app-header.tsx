'use client'

import { useMemo } from 'react'

import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Logo } from '@/components/ui/icons/logo'
import { Link } from '@/components/ui/link'
import { SIDEBAR_KEYBOARD_SHORTCUT, SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useHeader } from '@/hooks/use-header'
import { usePathname } from '@/hooks/use-pathname'
import { useScroll } from '@/hooks/use-scroll'
import { useTranslations } from '@/hooks/use-translations'
import { Route } from '@/lib/navigation'
import { cn } from '@/lib/utils'

export const AppHeader = ({ className, ...props }: React.ComponentPropsWithRef<'header'>) => {
  const { header } = useHeader()
  const { pathname } = usePathname()
  const { scrolled } = useScroll()
  const { open } = useSidebar()
  const t = useTranslations()

  const sidebarAction = useMemo(() => (open ? t('Common.sidebarClose') : t('Common.sidebarOpen')), [open, t])

  return (
    <>
      <header
        className={cn(
          'ml-[1px] min-h-12 shrink-0 gap-2 bg-background transition-[width,height] ease-linear',
          scrolled && 'border-b',
          className,
        )}
        {...props}
      >
        <div className="flex w-full items-center justify-between gap-2 px-4 py-4">
          <div className="flex h-10 grow items-center gap-1">
            <Tooltip delayDuration={600} disableHoverableContent>
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
            {header && <Breadcrumb className="flex h-full items-center">{header}</Breadcrumb>}
          </div>
          <Link
            className={cn(pathname === Route.Home && 'pointer-events-none')}
            href={Route.Home}
            title={t('Navigation.goToDashboard')}
          >
            <Logo className="mr-2 transition-[width,height]" height={24} />
          </Link>
        </div>
      </header>
    </>
  )
}
