'use client'

import { type AppRoutes } from 'next/types/routes'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { PanelLeftOpenIcon, PanelRightOpenIcon } from 'lucide-react'

import { Button, type ButtonProps } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useDevice } from '@/hooks/use-device'
import { usePathname } from '@/hooks/use-pathname'
import { cn } from '@/lib/utils'

export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
export const SIDEBAR_WIDTH = '18rem'
export const SIDEBAR_WIDTH_MOBILE = '18rem'
export const SIDEBAR_WIDTH_ICON = '3rem'
export const SIDEBAR_KEYBOARD_SHORTCUT = '\\'

interface SidebarContext {
  activePath: string
  setActivePath: (path: AppRoutes) => void
  isMobile: boolean
  label: string
  open: boolean
  openMobile: boolean
  setOpen: (open: boolean) => void
  setOpenMobile: (open: boolean) => void
  state: 'expanded' | 'collapsed'
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContext | null>(null)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider.')
  return context
}

export interface SidebarProviderProps extends React.ComponentProps<'div'> {
  defaultOpen?: boolean
  label?: string | ((open: boolean) => string)
  onOpenChange?: (open: boolean) => void
  open?: boolean
  setCookie?: (open: boolean) => void
}

export const SidebarProvider = ({
  children,
  className,
  defaultOpen = true,
  label: labelProp = open => `${open ? 'Close' : 'Open'} sidebar`,
  onOpenChange: setOpenProp,
  open: openProp,
  setCookie,
  style,
  ...props
}: SidebarProviderProps) => {
  const pathname = usePathname()
  const { isMobile } = useDevice()

  const [openMobile, setOpenMobile] = useState(false)
  const [_open, _setOpen] = useState(defaultOpen)

  const open = useMemo(() => openProp ?? _open, [openProp, _open])
  const state = useMemo(() => (open ? 'expanded' : 'collapsed'), [open])

  const [activePath, setActivePath] = useState(pathname)

  const setOpen = useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === 'function' ? value(open) : value
      if (setOpenProp) setOpenProp(openState)
      else _setOpen(openState)
      setCookie?.(openState)
    },
    [open, setOpenProp, setCookie]
  )

  const toggleSidebar = useCallback(
    () => (isMobile ? setOpenMobile(open => !open) : setOpen(open => !open)),
    [isMobile, setOpen]
  )

  const label = useMemo(() => (typeof labelProp === 'function' ? labelProp(open) : labelProp), [labelProp, open])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

  const contextValue = useMemo<SidebarContext>(
    () => ({
      activePath,
      isMobile,
      label,
      open,
      openMobile,
      setActivePath,
      setOpen,
      setOpenMobile,
      state,
      toggleSidebar,
    }),
    [activePath, isMobile, label, open, openMobile, setOpen, state, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          className={cn('group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar', className)}
          data-slot="sidebar-wrapper"
          style={
            {
              '--sidebar-width': SIDEBAR_WIDTH,
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

export interface SidebarProps extends React.ComponentProps<'div'> {
  collapsible?: 'offcanvas' | 'icon' | 'none'
  side?: 'left' | 'right'
  srDescription?: string
  srTitle?: string
  variant?: 'sidebar' | 'floating' | 'inset'
}

export const Sidebar = ({
  children,
  className,
  collapsible = 'offcanvas',
  side = 'left',
  srDescription,
  srTitle,
  variant = 'sidebar',
  ...props
}: SidebarProps) => {
  const { isMobile, openMobile, setOpenMobile, state } = useSidebar()

  if (collapsible === 'none')
    return (
      <div
        className={cn('flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground', className)}
        data-slot="sidebar"
        {...props}
      >
        {children}
      </div>
    )

  if (isMobile)
    return (
      <Sheet onOpenChange={setOpenMobile} open={openMobile} {...props}>
        {(srTitle || srDescription) && (
          <SheetHeader className="sr-only">
            {srTitle && <SheetTitle>{srTitle}</SheetTitle>}
            {srDescription && <SheetDescription>{srDescription}</SheetDescription>}
          </SheetHeader>
        )}
        <SheetContent
          className="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
          data-mobile="true"
          data-sidebar="sidebar"
          data-slot="sidebar"
          side={side}
          style={
            {
              '--sidebar-width': SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
        >
          <div className="flex size-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )

  return (
    <div
      className="group peer hidden bg-sidebar text-sidebar-foreground md:block"
      data-collapsible={state === 'collapsed' ? collapsible : ''}
      data-side={side}
      data-slot="sidebar"
      data-state={state}
      data-variant={variant}
    >
      <div
        className={cn(
          'relative h-svh w-(--sidebar-width) bg-transparent transition-[width] duration-150 ease-linear group-data-[collapsible=offcanvas]:w-0 group-data-[side=right]:rotate-180',
          variant === 'floating' || variant === 'inset'
            ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)'
        )}
      />
      <div
        className={cn(
          'fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-150 ease-linear md:flex',
          side === 'left'
            ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
            : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
          variant === 'floating' || variant === 'inset'
            ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'flex size-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow-sm'
          )}
          data-sidebar="sidebar"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export const SidebarTrigger = ({ className, onClick, ...props }: React.ComponentProps<typeof Button>) => {
  const { label, open, toggleSidebar } = useSidebar()
  const Icon = useMemo(() => (open ? PanelRightOpenIcon : PanelLeftOpenIcon), [open])

  return (
    <Button
      className={cn('size-10', className)}
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      onClick={event => {
        onClick?.(event)
        toggleSidebar()
      }}
      size="icon"
      variant="ghost"
      {...props}
    >
      <Icon className="size-5" />
      <span className="sr-only">{label}</span>
    </Button>
  )
}

export const SidebarRail = ({ className, ...props }: React.ComponentProps<'button'>) => {
  const { label, toggleSidebar } = useSidebar()

  return (
    <button
      aria-label={label}
      className={cn(
        '-translate-x-1/2 group-data-[side=left]:-right-4 [[data-side=left][data-collapsible=offcanvas]_&]:-right-2 [[data-side=right][data-collapsible=offcanvas]_&]:-left-2 absolute inset-y-0 z-20 hidden w-4 in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize transition-all ease-linear after:absolute after:inset-y-0 after:right-2 after:w-px after:bg-sidebar-border hover:after:w-0.5 group-data-[side=right]:left-0 group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full sm:flex [[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
        className
      )}
      data-sidebar="rail"
      data-slot="sidebar-rail"
      onClick={toggleSidebar}
      tabIndex={-1}
      title={label}
      {...props}
    />
  )
}

export const SidebarInset = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    className={cn(
      'relative flex min-h-svh flex-1 flex-col bg-background peer-data-[variant=inset]:min-h-[calc(100svh-(--spacing(4)))] md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2 md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm',
      className
    )}
    data-slot="sidebar-inset"
    {...props}
  />
)

export const SidebarInput = ({ className, ...props }: React.ComponentProps<typeof Input>) => (
  <Input
    className={cn('h-8 w-full bg-background shadow-none', className)}
    data-sidebar="input"
    data-slot="sidebar-input"
    {...props}
  />
)

export const SidebarHeader = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    className={cn('flex flex-col gap-2 p-2', className)}
    data-sidebar="header"
    data-slot="sidebar-header"
    {...props}
  />
)

export const SidebarFooter = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    className={cn('flex flex-col gap-2 p-2', className)}
    data-sidebar="footer"
    data-slot="sidebar-footer"
    {...props}
  />
)

export const SidebarSeparator = ({ className, ...props }: React.ComponentProps<typeof Separator>) => (
  <Separator
    className={cn('mx-2 w-auto bg-sidebar-border', className)}
    data-sidebar="separator"
    data-slot="sidebar-separator"
    {...props}
  />
)

export const SidebarContent = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    className={cn(
      'flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
      className
    )}
    data-sidebar="content"
    data-slot="sidebar-content"
    {...props}
  />
)

export const SidebarGroup = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    className={cn('relative flex w-full min-w-0 flex-col p-2', className)}
    data-sidebar="group"
    data-slot="sidebar-group"
    {...props}
  />
)

export const SidebarGroupLabel = ({
  asChild = false,
  className,
  ...props
}: React.ComponentProps<'div'> & { asChild?: boolean }) => {
  const Component = useMemo(() => (asChild ? Slot : 'div'), [asChild])

  return (
    <Component
      className={cn(
        'group-data-[collapsible=icon]:-mt-8 flex h-8 shrink-0 items-center rounded-md px-2 font-medium text-sidebar-foreground/70 text-xs outline-hidden ring-sidebar-ring transition-[margin,opacity] duration-150 ease-linear focus-visible:ring-2 group-data-[collapsible=icon]:opacity-0 [&>svg]:size-4 [&>svg]:shrink-0',
        className
      )}
      data-sidebar="group-label"
      data-slot="sidebar-group-label"
      {...props}
    />
  )
}

export const SidebarGroupAction = ({
  asChild = false,
  className,
  ...props
}: React.ComponentProps<'button'> & { asChild?: boolean }) => {
  const Comp = useMemo(() => (asChild ? Slot : 'button'), [asChild])

  return (
    <Comp
      className={cn(
        'after:-inset-2 absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-hidden ring-sidebar-ring transition-transform after:absolute hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 group-data-[collapsible=icon]:hidden md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0',
        className
      )}
      data-sidebar="group-action"
      data-slot="sidebar-group-action"
      {...props}
    />
  )
}

export const SidebarGroupContent = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    className={cn('w-full text-sm', className)}
    data-sidebar="group-content"
    data-slot="sidebar-group-content"
    {...props}
  />
)

export const SidebarMenu = ({ className, ...props }: React.ComponentProps<'ul'>) => {
  const { open } = useSidebar()

  return (
    <ul
      className={cn('flex w-full min-w-0 flex-col', open ? 'gap-1' : 'gap-[9.2px]', className)}
      data-sidebar="menu"
      data-slot="sidebar-menu"
      {...props}
    />
  )
}

export const SidebarMenuItem = ({ className, ...props }: React.ComponentProps<'li'>) => (
  <li
    className={cn('group/menu-item relative', className)}
    data-sidebar="menu-item"
    data-slot="sidebar-menu-item"
    {...props}
  />
)

export interface SidebarMenuButtonProps
  extends Omit<ButtonProps, 'size' | 'variant'>,
    VariantProps<typeof sidebarMenuVariants> {
  active?: boolean
  asChild?: boolean
  tooltip?: string | React.ComponentProps<typeof TooltipContent>
}

export const SidebarMenuButton = ({
  active = false,
  asChild = false,
  className,
  color,
  onClick,
  size,
  tooltip,
  variant,
  ...props
}: SidebarMenuButtonProps) => {
  const { isMobile, state } = useSidebar()
  const [hideTooltip, setHideTooltip] = useState(false)

  const Component = useMemo(() => (asChild ? Slot : Button), [asChild])

  const content = (
    <Component
      className={cn(sidebarMenuVariants({ size, variant }), className)}
      color={color ?? undefined}
      data-active={active}
      data-sidebar="menu-button"
      data-size={size}
      data-slot="sidebar-menu-button"
      {...props}
    />
  )

  const hiddenTooltip = useMemo(() => state !== 'collapsed' || isMobile, [state, isMobile])

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)
      if (isMobile) return
      setHideTooltip(true)
      setTimeout(() => {
        setHideTooltip(false)
      }, 200)
    },
    [onClick, isMobile]
  )

  if (active || isMobile || !tooltip || hideTooltip) return content
  if (typeof tooltip === 'string') tooltip = { children: tooltip }

  return (
    <Tooltip>
      <TooltipTrigger asChild onClick={handleClick}>
        {content}
      </TooltipTrigger>
      <TooltipContent align="center" hidden={hiddenTooltip} side="right" {...tooltip} />
    </Tooltip>
  )
}

export const sidebarMenuVariants = cva(
  `
    peer/menu-button flex w-full cursor-pointer items-center gap-2 overflow-hidden rounded-md px-3 py-2 text-left text-sm ring-sidebar-ring
    outline-hidden transition-[width,height,padding]
    group-has-data-[sidebar=menu-action]/menu-item:pr-8
    group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!
    hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
    active:bg-sidebar-accent active:text-sidebar-accent-foreground
    disabled:pointer-events-none disabled:opacity-50
    aria-disabled:pointer-events-none aria-disabled:opacity-50
    focus-visible:ring-2 focus-visible:ring-ring/50
    data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground
    data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground
    [&>span:last-child]:truncate
    [&>svg]:shrink-0 [&>svg]:grow-0
  `,
  {
    defaultVariants: {
      variant: 'default',
      size: 'base',
    },
    variants: {
      variant: {
        default: 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        outline: `
          shadow-[0_0_0_1px_hsl(var(--sidebar-border))]
          hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]
        `,
      },
      size: {
        base: 'py-2 text-sm',
        sm: 'py-1 text-xs',
        lg: 'py-3 text-sm group-data-[collapsible=icon]:p-0!',
      },
    },
  }
)

export const SidebarMenuAction = ({
  asChild = false,
  className,
  showOnHover = false,
  ...props
}: React.ComponentProps<'button'> & {
  asChild?: boolean
  clickable?: boolean
  showOnHover?: boolean
}) => {
  const Component = useMemo(() => (asChild ? Slot : 'button'), [asChild])

  return (
    <Component
      className={cn(
        'after:-inset-2 absolute top-2 right-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-hidden ring-sidebar-ring transition-transform after:absolute hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0',
        showOnHover &&
          'group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0',
        className
      )}
      data-sidebar="menu-action"
      data-slot="sidebar-menu-action"
      {...props}
    />
  )
}

export const SidebarMenuBadge = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    className={cn(
      'pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 font-medium text-sidebar-foreground text-xs tabular-nums peer-hover/menu-button:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground',
      className
    )}
    data-sidebar="menu-badge"
    data-slot="sidebar-menu-badge"
    {...props}
  />
)

export const SidebarMenuSkeleton = ({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<'div'> & {
  showIcon?: boolean
}) => {
  const width = useMemo(() => `${Math.floor(Math.random() * 40) + 50}%`, [])

  return (
    <div
      className={cn('flex h-8 items-center gap-2 rounded-md px-2', className)}
      data-sidebar="menu-skeleton"
      data-slot="sidebar-menu-skeleton"
      {...props}
    >
      {showIcon && <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            '--skeleton-width': width,
          } as React.CSSProperties
        }
      />
    </div>
  )
}

export const SidebarMenuSub = ({ className, ...props }: React.ComponentProps<'ul'>) => (
  <ul
    className={cn(
      'ms-[18px] flex min-w-0 translate-x-px flex-col gap-1 border-sidebar-border border-l py-0.5 ps-2.5 group-data-[collapsible=icon]:hidden',
      className
    )}
    data-sidebar="menu-sub"
    data-slot="sidebar-menu-sub"
    {...props}
  />
)

export const SidebarMenuSubItem = ({ className, ...props }: React.ComponentProps<'li'>) => (
  <li
    className={cn('group/menu-sub-item relative', className)}
    data-sidebar="menu-sub-item"
    data-slot="sidebar-menu-sub-item"
    {...props}
  />
)

export const SidebarMenuSubButton = ({
  asChild = false,
  className,
  isActive = false,
  size = 'md',
  ...props
}: React.ComponentProps<'a'> & {
  asChild?: boolean
  size?: 'sm' | 'md'
  isActive?: boolean
}) => {
  const Component = useMemo(() => (asChild ? Slot : 'a'), [asChild])

  return (
    <Component
      className={cn(
        '-translate-x-px flex h-7 min-w-0 items-center gap-2 overflow-hidden rounded-md border-transparent border-l-2 px-2 text-sidebar-foreground/80 outline-hidden ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 data-[active=true]:rounded-l-none data-[active=true]:border-sidebar-border data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground',
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm',
        className
      )}
      data-active={isActive}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-slot="sidebar-menu-sub-button"
      {...props}
    />
  )
}
