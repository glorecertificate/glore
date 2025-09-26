'use client'

import { useMemo } from 'react'

import { useTranslations } from '@repo/i18n'
import { Breadcrumb } from '@repo/ui/components/breadcrumb'
import { SIDEBAR_KEYBOARD_SHORTCUT, SidebarTrigger, useSidebar } from '@repo/ui/components/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui/components/tooltip'
import { useScroll } from '@repo/ui/hooks/use-scroll'
import { GloreIcon } from '@repo/ui/icons/glore'
import { cn } from '@repo/ui/utils'

import { Link } from '@/components/ui/link'
import { useHeader } from '@/hooks/use-header'
import { useNavigation } from '@/hooks/use-navigation'

export const AppHeader = ({ className, ...props }: React.ComponentPropsWithRef<'header'>) => {
  const { hasShadow, header } = useHeader()
  const { pathname } = useNavigation()
  const { scrolled } = useScroll()
  const { open } = useSidebar()
  const t = useTranslations()

  const sidebarAction = useMemo(() => (open ? t('Common.sidebarClose') : t('Common.sidebarOpen')), [open, t])

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-5 ml-[1px] min-h-12 shrink-0 gap-2 bg-background transition-[width,height] ease-linear',
          hasShadow && scrolled && 'border-b',
          className,
        )}
        {...props}
      >
        <div className="flex w-full items-center justify-between gap-2 p-4">
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
            className={cn(pathname === '/' && 'pointer-events-none')}
            href="/"
            title={t('Navigation.goToDashboard')}
          >
            <GloreIcon className="mr-2 transition-[width,height]" height={24} />
          </Link>
        </div>
      </header>
    </>
  )
}
