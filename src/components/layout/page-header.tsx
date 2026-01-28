'use client'

import { usePathname } from 'next/navigation'

import settings from '~/config/settings.json'

import { GloreIcon } from '@/components/icons/glore'
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb'
import { Link } from '@/components/ui/link'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useScroll } from '@/hooks/use-scroll'
import { APP_ROOT } from '@/lib/constants'
import { cn } from '@/lib/utils'

export const PageHeader = ({
  children,
  className,
  description,
  hideLogo,
  title,
  ...props
}: React.ComponentProps<'header'> & {
  description?: React.ReactNode
  hideLogo?: boolean
  title?: React.ReactNode
}) => {
  const pathname = usePathname()
  const { scrolled } = useScroll()
  const { action } = useSidebar()

  return (
    <header
      className={cn(
        'sticky top-0 z-5 ml-px min-h-12 shrink-0 gap-2 bg-linear-to-tr from-background to-background/90 transition-[width,height] ease-linear',
        scrolled && 'border-b'
      )}
      {...props}
    >
      <div className="flex w-full items-center justify-between gap-2 p-4">
        <div className={cn('flex h-10 grow items-center gap-3', className)}>
          <Tooltip delayDuration={600} disableHoverableContent>
            <TooltipTrigger asChild>
              <SidebarTrigger className="-ml-1" />
            </TooltipTrigger>
            <TooltipContent showArrow side="right">
              <p className="font-medium text-xs">{action}</p>
              <p className="font-mono text-[10px] text-gray-400 dark:text-gray-500">{`Ctrl + ${settings.sidebarShortcut.toUpperCase()}`}</p>
            </TooltipContent>
          </Tooltip>
          {children ?? <PageBreadcrumb description={description} title={title} />}
        </div>
        {!hideLogo && (
          <Link className={cn(pathname === APP_ROOT && 'pointer-events-none')} href={APP_ROOT}>
            <GloreIcon className="mr-2 w-18 transition-[width,height]" height={200} />
          </Link>
        )}
      </div>
    </header>
  )
}
