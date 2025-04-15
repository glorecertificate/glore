'use client'

import { useCallback, useMemo } from 'react'

import { RefreshCwIcon, RefreshCwOffIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Logo } from '@/components/ui/logo'
import { SIDEBAR_KEYBOARD_SHORTCUT, SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useHeader } from '@/hooks/use-header'
import { usePathname } from '@/hooks/use-pathname'
import { useScroll } from '@/hooks/use-scroll'
import { useSyncStatus } from '@/hooks/use-sync-status'
import { Route } from '@/lib/navigation'
import { cn } from '@/lib/utils'

export const AppHeader = ({ className, ...props }: React.ComponentPropsWithRef<'header'>) => {
  const { breadcrumb, headerShadow, subHeader } = useHeader()
  const pathname = usePathname()
  const { isScrolled } = useScroll()
  const { open } = useSidebar()
  const { syncStatus } = useSyncStatus()
  const t = useTranslations()

  const sidebarAction = useMemo(() => (open ? t('Common.sidebarClose') : t('Common.sidebarOpen')), [open, t])

  const onRefreshClick = useCallback(() => {
    window.location.reload()
  }, [])

  return (
    <>
      <header
        className={cn(
          'ml-[1px] min-h-12 shrink-0 gap-2 bg-background transition-[width,height] ease-linear',
          isScrolled && headerShadow && 'border-b',
          className,
        )}
        {...props}
      >
        <div className="flex w-full shrink-0 items-center justify-between gap-2 px-4 py-4">
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
          <div className="mr-2 flex items-center">
            {syncStatus === 'syncing' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="mr-3 cursor-default">
                    <RefreshCwIcon className="size-4 animate-spin text-muted-foreground duration-700" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent arrow={false} side="bottom">
                  <p>{t('Common.syncChanges')}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {syncStatus === 'error' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="mr-3" onClick={onRefreshClick}>
                    <RefreshCwOffIcon className="size-4 text-destructive" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent arrow={false} className="text-center" side="bottom">
                  <p>
                    {t('Common.syncError')}
                    {' ⚠️'}
                  </p>
                  <p className="text-[10px] text-gray-400">{t('Common.syncErrorSubtitle')}</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Link
              className={cn(pathname === Route.Home && 'pointer-events-none')}
              href={Route.Home}
              title={t('Navigation.goToDashboard')}
            >
              <Logo className="transition-[width,height]" height={20} />
            </Link>
          </div>
        </div>
        {subHeader && <div className="container mx-auto bg-background px-8 pt-1 pb-5">{subHeader}</div>}
      </header>
    </>
  )
}
