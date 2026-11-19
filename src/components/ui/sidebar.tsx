'use client'

import { Route } from 'next'
import { usePathname } from 'next/navigation'
import { createContext, startTransition, use, useEffect, useEffectEvent, useRef, useState } from 'react'

import { Slot } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'
import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Input, type InputProps } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useDevice } from '@/hooks/use-device'
import { useShortcut } from '@/hooks/use-shortcut'
import { toPx, useSidebarResize } from '@/hooks/use-sidebar-resize'
import { type CookieName, prefixCookieName } from '@/lib/cookies'
import { SHORTCUTS } from '@/lib/shortcuts'
import { cn } from '@/lib/utils'

export const SIDEBAR_WIDTH = '16rem'
export const MIN_SIDEBAR_WIDTH = '14rem'
export const MAX_SIDEBAR_WIDTH = '20rem'
export const SIDEBAR_WIDTH_MOBILE = '18rem'
export const SIDEBAR_WIDTH_ICON = '3rem'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7

const setSidebarCookie = (name: CookieName, value: string) => {
  document.cookie = `${prefixCookieName(name)}=${value}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

interface SidebarContext {
  action: string
  activePath: string
  isDraggingRail: boolean
  isMobile: boolean
  isTablet: boolean
  open: boolean
  leaving: boolean
  leaveMobile: () => void
  openMobile: boolean
  setActivePath: (path: Route) => void
  setIsDraggingRail: (isDraggingRail: boolean) => void
  setOpen: (open: boolean) => void
  setOpenMobile: (open: boolean) => void
  setWidth: (width: string, options?: { syncState?: boolean }) => void
  state: 'expanded' | 'collapsed'
  toggleSidebar: () => void
  width: string
}

const SidebarContext = createContext<SidebarContext | null>(null)

export const useSidebar = () => {
  const context = use(SidebarContext)
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider')
  return context
}

export const SidebarProvider = ({
  children,
  className,
  defaultOpen = true,
  defaultWidth = SIDEBAR_WIDTH,
  onOpenChange: setOpenProp,
  open: openProp,
  style,
  ...props
}: React.ComponentProps<'div'> & {
  defaultOpen?: boolean
  defaultWidth?: string
  onOpenChange?: (open: boolean) => void
  open?: boolean
}) => {
  const { isMobile, isTablet } = useDevice()
  const pathname = usePathname()
  const t = useTranslations('Components.Sidebar')

  const [width, setWidth] = useState(defaultWidth)
  const [openMobile, setOpenMobile] = useState(false)
  const [isDraggingRail, setIsDraggingRail] = useState(false)
  const [activePath, setActivePath] = useState(pathname)

  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const open = isTablet ? overlayOpen : (openProp ?? isOpen)

  const leaveMobile = () => {
    setLeaving(true)
    setOpenMobile(false)
  }

  const openRef = useRef(open)
  const setOpenPropRef = useRef(setOpenProp)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const state = open ? 'expanded' : 'collapsed'
  const action = (isMobile ? openMobile : open) ? t('close') : t('open')

  useEffect(() => {
    openRef.current = open
    setOpenPropRef.current = setOpenProp
  }, [open, setOpenProp])

  const applyWidth = (value: string) => {
    document.documentElement.style.setProperty('--sidebar-width', value)
    if (wrapperRef.current) wrapperRef.current.style.setProperty('--sidebar-width', value)
  }

  const setOpen = (value: boolean | ((value: boolean) => boolean)) => {
    const openState = typeof value === 'function' ? value(openRef.current) : value
    if (isTablet) {
      setOverlayOpen(openState)
      return
    }
    const openAction = setOpenPropRef.current ?? setIsOpen
    openAction(openState)
    setSidebarCookie('sidebarOpen', String(openState))
  }

  const handleSetWidth = (value: string, options?: { syncState?: boolean }) => {
    applyWidth(value)
    if (options?.syncState ?? true) {
      startTransition(() => {
        setWidth(value)
        setSidebarCookie('sidebarWidth', value)
      })
    }
  }

  const toggle = () => {
    setLeaving(false)
    const setter = isMobile ? setOpenMobile : setOpen
    setter(prev => !prev)
  }

  const toggleSidebar = useEffectEvent(toggle)

  useShortcut(SHORTCUTS.sidebar, toggle)

  useEffect(() => {
    setActivePath(pathname)
    setOpenMobile(false)
    setOverlayOpen(false)
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    if (!overlayOpen) return
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOverlayOpen(false)
    }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [overlayOpen])

  useEffect(() => {
    if (!isTablet) setOverlayOpen(false)
    if (!isMobile) setOpenMobile(false)
  }, [isMobile, isTablet])

  const contextValue: SidebarContext = {
    action,
    activePath,
    isDraggingRail,
    isMobile,
    isTablet,
    open,
    leaveMobile,
    leaving,
    openMobile,
    setActivePath,
    setIsDraggingRail,
    setOpen,
    setOpenMobile,
    setWidth: handleSetWidth,
    state,
    // eslint-disable-next-line react-compiler/rules-of-hooks
    toggleSidebar,
    width,
  }

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          className={cn('group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar', className)}
          ref={wrapperRef}
          style={
            {
              '--sidebar-width': width,
              '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}

const settle = (node: HTMLDivElement | null) => {
  if (!node) return undefined
  const frame = requestAnimationFrame(() => node.removeAttribute('data-settling'))
  return () => cancelAnimationFrame(frame)
}

export const Sidebar = ({
  side = 'left',
  variant = 'sidebar',
  collapsible = 'offcanvas',
  className,
  children,
  style,
  ...props
}: React.ComponentProps<'div'> & {
  side?: 'left' | 'right'
  variant?: 'sidebar' | 'floating' | 'inset'
  collapsible?: 'offcanvas' | 'icon' | 'none'
}) => {
  const { isMobile, isTablet, isDraggingRail, leaving, open, openMobile, setOpen, setOpenMobile, state } = useSidebar()

  if (collapsible === 'none') {
    return (
      <div
        className={cn('flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground', className)}
        {...props}
      >
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <Sheet onOpenChange={setOpenMobile} open={openMobile} {...props}>
        <SheetContent
          className={cn(
            'dark w-(--sidebar-width) border-sidebar-border bg-sidebar p-0 pt-safe pb-safe text-sidebar-foreground sidebar-scope [&>button]:hidden',
            leaving && 'data-[state=closed]:animate-none'
          )}
          data-mobile="true"
          data-sidebar="sidebar"
          overlayClassName={cn(leaving && 'data-[state=closed]:animate-none')}
          side={side}
          style={
            {
              '--sidebar-width': SIDEBAR_WIDTH_MOBILE,
              ...style,
            } as React.CSSProperties
          }
        >
          <div className="flex size-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className="group dark peer hidden text-sidebar-foreground sidebar-scope md:block"
      data-collapsible={state === 'collapsed' ? collapsible : ''}
      data-dragging={isDraggingRail}
      data-settling
      ref={settle}
      data-side={side}
      data-state={state}
      data-tablet={isTablet}
      data-variant={variant}
    >
      {isTablet && open && (
        <div
          aria-hidden
          className="fixed inset-0 z-9 bg-black/40 motion-safe:animate-in motion-safe:duration-200 motion-safe:fade-in-0"
          data-slot="sidebar-backdrop"
          onClick={() => setOpen(false)}
        />
      )}
      <div
        className={cn(
          'relative h-svh w-(--sidebar-width) bg-transparent transition-[width] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
          'md:max-lg:w-(--sidebar-width-icon)',
          'group-data-[collapsible=offcanvas]:w-0',
          'group-data-[side=right]:rotate-180',
          variant === 'floating' || variant === 'inset'
            ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
          'group-data-settling:duration-0! group-data-settling:*:duration-0! group-data-[dragging=true]:duration-0! group-data-[dragging=true]:*:duration-0!'
        )}
      />
      <div
        className={cn(
          'fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:flex',
          'group-data-[tablet=true]:group-data-[state=expanded]:shadow-2xl',
          side === 'left'
            ? 'left-0 group-data-[collapsible=offcanvas]:-left-(--sidebar-width)'
            : 'right-0 group-data-[collapsible=offcanvas]:-right-(--sidebar-width)',
          variant === 'floating' || variant === 'inset'
            ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
          'group-data-settling:duration-0! group-data-settling:*:duration-0! group-data-[dragging=true]:duration-0! group-data-[dragging=true]:*:duration-0!',
          className
        )}
        {...props}
      >
        <div
          className="flex size-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow-sm"
          data-sidebar="sidebar"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export const SidebarTrigger = ({
  className,
  indicator,
  indicatorLabel,
  onClick,
  ...props
}: ButtonProps & { indicator?: boolean; indicatorLabel?: string }) => {
  const { action, toggleSidebar } = useSidebar()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    toggleSidebar()
  }

  return (
    <Button
      className={cn('relative size-7', className)}
      data-sidebar="trigger"
      onClick={handleClick}
      size="icon"
      variant="ghost"
      {...props}
    >
      <LucideIcon name="panel-left" className="size-4.5! text-current" />
      <span className="sr-only">{action}</span>
      {indicator && (
        <span
          className="absolute top-0.5 right-0.5 size-2 rounded-full bg-sidebar-badge"
          data-slot="sidebar-trigger-indicator"
        >
          {indicatorLabel && <span className="sr-only">{indicatorLabel}</span>}
        </span>
      )}
    </Button>
  )
}

export const SidebarRail = ({
  className,
  enableDrag = true,
  ref,
  style,
  ...props
}: React.ComponentProps<'button'> & {
  enableDrag?: boolean
}) => {
  const { action, setIsDraggingRail, setWidth, state, toggleSidebar, width } = useSidebar()

  const cursor = (() => {
    if (state === 'collapsed') {
      return 'e-resize'
    }
    const currentPx = toPx(width)
    const minPx = toPx(MIN_SIDEBAR_WIDTH)
    const maxPx = toPx(MAX_SIDEBAR_WIDTH)
    if (currentPx <= minPx + 1) {
      return 'e-resize'
    }
    if (currentPx >= maxPx - 1) {
      return 'w-resize'
    }
    return 'ew-resize'
  })()

  const railStyle = { cursor, ...style }

  const { dragRef, onMouseDown } = useSidebarResize({
    currentWidth: width,
    direction: 'right',
    enableDrag,
    isCollapsed: state === 'collapsed',
    maxResizeWidth: MAX_SIDEBAR_WIDTH,
    minResizeWidth: MIN_SIDEBAR_WIDTH,
    onResize: setWidth,
    onToggle: toggleSidebar,
    setIsDraggingRail,
  })

  const combinedRef: React.RefCallback<HTMLButtonElement> = value => {
    for (const currentRef of [ref, dragRef]) {
      if (!currentRef) {
        continue
      }
      if (typeof currentRef === 'function') {
        currentRef(value)
        continue
      }
      currentRef.current = value
    }
  }

  return (
    <button
      type="button"
      aria-label={action}
      className={cn(
        'absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-[left,right,translate] ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-0.75 after:w-0.5 hover:after:bg-sidebar-border sm:flex pointer-coarse:hidden!',
        'group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar',
        '[[data-side=left][data-collapsible=offcanvas]_&]:-right-2',
        '[[data-side=right][data-collapsible=offcanvas]_&]:-left-2',
        className
      )}
      data-sidebar="rail"
      onMouseDown={onMouseDown}
      ref={combinedRef}
      style={railStyle}
      tabIndex={-1}
      title={action}
      {...props}
    />
  )
}

export const SidebarInset = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    className={cn(
      'relative flex min-h-svh min-w-0 flex-1 flex-col bg-canvas',
      'peer-data-[variant=inset]:min-h-[calc(100svh-(--spacing(4)))] md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2',
      className
    )}
    {...props}
  />
)

export const SidebarInput = ({ className, ...props }: InputProps) => (
  <Input className={cn('h-8 w-full bg-background shadow-none', className)} data-sidebar="input" {...props} />
)

export const SidebarHeader = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div className={cn('flex flex-col gap-2 p-2', className)} data-sidebar="header" {...props} />
)

export const SidebarFooter = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div className={cn('flex flex-col gap-2 p-2', className)} data-sidebar="footer" {...props} />
)

export const SidebarSeparator = ({ className, ...props }: React.ComponentProps<typeof Separator>) => (
  <Separator className={cn('mx-2 w-auto bg-sidebar-border', className)} data-sidebar="separator" {...props} />
)

export const SidebarContent = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    className={cn(
      'flex min-h-0 flex-1 flex-col gap-2 overflow-auto overscroll-contain group-data-[collapsible=icon]:overflow-hidden pointer-coarse:-my-1 pointer-coarse:py-1',
      className
    )}
    data-sidebar="content"
    {...props}
  />
)

export const SidebarGroup = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div className={cn('relative flex w-full min-w-0 flex-col p-2', className)} data-sidebar="group" {...props} />
)

export const SidebarGroupLabel = ({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> & {
  asChild?: boolean
}) => {
  const Comp = asChild ? Slot : 'div'

  return (
    <Comp
      className={cn(
        'flex h-6 shrink-0 items-center px-3 type-overline text-sidebar-muted outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:focus-ring-inset [&>svg]:size-4 [&>svg]:shrink-0',
        'group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
        className
      )}
      data-sidebar="group-label"
      {...props}
    />
  )
}

export const SidebarGroupAction = ({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & { asChild?: boolean }) => {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      className={cn(
        'absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-hidden transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:focus-ring-inset [&>svg]:size-4 [&>svg]:shrink-0',
        'touch-hit',
        'group-data-[collapsible=icon]:hidden',
        className
      )}
      data-sidebar="group-action"
      {...props}
    />
  )
}

export const SidebarGroupContent = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div className={cn('w-full text-sm', className)} data-sidebar="group-content" {...props} />
)

export const SidebarMenu = ({ className, ...props }: React.ComponentProps<'ul'>) => (
  <ul
    className={cn(
      'flex w-full min-w-0 flex-col gap-1 pointer-coarse:gap-2 pointer-coarse:group-data-[collapsible=icon]:gap-3',
      className
    )}
    data-sidebar="menu"
    {...props}
  />
)

export const SidebarMenuItem = ({ className, ...props }: React.ComponentProps<'li'>) => (
  <li className={cn('group/menu-item relative', className)} data-sidebar="menu-item" {...props} />
)

export const SidebarMenuButton = ({
  active = false,
  asChild = false,
  className,
  size = 'default',
  tooltip,
  variant = 'default',
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof sidebarMenuButtonVariants> & {
    active?: boolean
    asChild?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  }) => {
  const Component = asChild ? Slot : 'button'
  const { isMobile, state } = useSidebar()

  const button = (
    <Component
      className={cn(sidebarMenuButtonVariants({ size, variant }), className)}
      data-active={active || undefined}
      data-sidebar="menu-button"
      data-size={size}
      {...props}
    />
  )

  if (!tooltip) {
    return button
  }

  const tooltipProps = typeof tooltip === 'string' ? { children: tooltip } : tooltip

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        align="center"
        hidden={state !== 'collapsed' || isMobile}
        showArrow
        side="right"
        {...tooltipProps}
      />
    </Tooltip>
  )
}

export const sidebarMenuButtonVariants = cva(
  `peer/menu-button touch-hit-y flex w-full cursor-pointer items-center gap-2.5 overflow-hidden rounded-lg px-3 py-2 text-left font-medium text-sidebar-foreground outline-hidden transition-[width,height,padding,color,background-color,box-shadow] duration-100 group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:focus-ring-inset disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-active:bg-sidebar-active data-active:font-semibold data-active:text-sidebar-accent-foreground! data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground pointer-coarse:overflow-visible pointer-coarse:group-data-[collapsible=icon]:after:left-1/2! pointer-coarse:group-data-[collapsible=icon]:after:w-11! pointer-coarse:group-data-[collapsible=icon]:after:-translate-1/2! [&>span:last-child]:truncate pointer-coarse:group-data-[collapsible=icon]:[&>span:not(.absolute,.sr-only)]:hidden [&>svg]:size-4 [&>svg]:shrink-0 data-active:[&>svg]:text-sidebar-ring`,
  {
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
    variants: {
      variant: {
        default: 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        outline:
          'bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]',
      },
      size: {
        default: 'h-9 text-sm',
        sm: 'h-7 text-xs',
        lg: 'h-12 text-sm group-data-[collapsible=icon]:p-0!',
      },
    },
  }
)

export const SidebarMenuAction = ({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<'button'> & {
  asChild?: boolean
  showOnHover?: boolean
}) => {
  const Component = asChild ? Slot : 'button'

  return (
    <Component
      className={cn(
        'absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-hidden transition-transform peer-hover/menu-button:text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:focus-ring-inset [&>svg]:size-4 [&>svg]:shrink-0',
        'touch-hit',
        'peer-data-[size=sm]/menu-button:top-1',
        'peer-data-[size=default]/menu-button:top-1.5',
        'peer-data-[size=lg]/menu-button:top-2.5',
        'group-data-[collapsible=icon]:hidden',
        showOnHover &&
          'group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 peer-data-active/menu-button:text-sidebar-accent-foreground data-[state=open]:opacity-100 md:opacity-0',
        className
      )}
      data-sidebar="menu-action"
      {...props}
    />
  )
}

export const SidebarMenuBadge = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    className={cn(
      'pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium text-sidebar-foreground tabular-nums select-none',
      'peer-hover/menu-button:text-sidebar-accent-foreground peer-data-active/menu-button:text-sidebar-accent-foreground',
      'peer-data-[size=sm]/menu-button:top-1',
      'peer-data-[size=default]/menu-button:top-1.5',
      'peer-data-[size=lg]/menu-button:top-2.5',
      'group-data-[collapsible=icon]:hidden',
      className
    )}
    data-sidebar="menu-badge"
    {...props}
  />
)

export const SidebarMenuSub = ({ className, ...props }: React.ComponentProps<'ul'>) => (
  <ul
    className={cn(
      'mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-2',
      'group-data-[collapsible=icon]:hidden',
      className
    )}
    data-sidebar="menu-sub"
    {...props}
  />
)

export const SidebarMenuSubItem = ({ ...props }: React.ComponentProps<'li'>) => <li {...props} />

export const SidebarMenuSubButton = ({
  active,
  asChild = false,
  className,
  size = 'md',
  ...props
}: React.ComponentProps<'a'> & {
  active?: boolean
  asChild?: boolean
  size?: 'sm' | 'md'
}) => {
  const Component = asChild ? Slot : 'a'

  return (
    <Component
      className={cn(
        'flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:focus-ring-inset active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground',
        'data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground',
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm',
        'group-data-[collapsible=icon]:hidden',
        className
      )}
      data-active={active || undefined}
      data-sidebar="menu-sub-button"
      data-size={size}
      {...props}
    />
  )
}
