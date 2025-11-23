'use client'

import { GloreIcon } from '@/components/icons/glore'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Link } from '@/components/ui/link'
import { SIDEBAR_KEYBOARD_SHORTCUT, SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { usePathname } from '@/hooks/use-pathname'
import { PortalContainer } from '@/hooks/use-portal'
import { useScroll } from '@/hooks/use-scroll'
import { cn } from '@/lib/utils'

export const AppHeader = ({ children, className, ...props }: React.ComponentProps<'header'>) => {
  const pathname = usePathname()
  const { scrolled } = useScroll()
  const { action, open } = useSidebar()

  return (
    <header
      className={cn(
        'sticky top-0 z-5 ml-px min-h-12 shrink-0 gap-2 bg-linear-to-tr from-background to-background/90 transition-[width,height] ease-linear',
        scrolled && 'border-b',
        className
      )}
      {...props}
    >
      <div className="flex w-full items-center justify-between gap-2 p-4">
        <div className="flex h-10 grow items-center gap-3">
          <Tooltip delayDuration={600} disableHoverableContent>
            <TooltipTrigger asChild>
              <SidebarTrigger
                className={cn(
                  '-ml-1 [&_svg]:size-[18px] [&_svg]:stroke-foreground/64 [&_svg]:text-foreground/64',
                  open && '[&_svg]:size-5'
                )}
              />
            </TooltipTrigger>
            <TooltipContent showArrow side="right">
              <p className="font-medium text-xs">{action}</p>
              <p className="font-mono text-[10px] text-gray-400 dark:text-gray-500">{`Ctrl + ${SIDEBAR_KEYBOARD_SHORTCUT.toUpperCase()}`}</p>
            </TooltipContent>
          </Tooltip>
          <Breadcrumb className="flex h-full grow items-center" id={PortalContainer.Breadcrumb}>
            <Skeleton className="h-5 w-64" />
          </Breadcrumb>
        </div>
        <Link className={cn(pathname === '/' && 'pointer-events-none')} href="/">
          <GloreIcon className="mr-2 w-18 transition-[width,height]" height={200} />
        </Link>
      </div>
    </header>
  )
}
