'use client'

import { Route } from 'next'
import dynamic from 'next/dynamic'
import { redirect, usePathname, useSearchParams } from 'next/navigation'
import { Fragment, Suspense, useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { logout } from '@/actions/auth'
import { NotificationBell } from '@/components/features/notifications/notification-bell'
import { DashboardIcon } from '@/components/icons/dashboard'
import { LucideIcon } from '@/components/icons/lucide'
import {
  type NavigationViewer,
  entriesFor,
  showsOrganizationSwitcher,
  sidebarEntriesFor,
} from '@/components/layout/navigation'
import { OrganizationSwitcher } from '@/components/layout/organization-switcher'
import { useNavigationLabels } from '@/components/layout/use-navigation-labels'
import { useSession } from '@/components/providers/session'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Image } from '@/components/ui/image'
import { Link } from '@/components/ui/link'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarRail,
  sidebarMenuButtonVariants,
  useSidebar,
} from '@/components/ui/sidebar'
import { ThemeSwitch } from '@/components/ui/theme-switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type UserOrganization } from '@/db/queries/user'
import { APP_ROOT, AUTH_ROOT } from '@/lib/constants'
import { type IconName } from '@/lib/types'
import { cn, sleep } from '@/lib/utils'
import settings from '~/config/app.json'

const loadSearchCommand = async () => (await import('@/components/layout/search-command')).SearchCommand

const SearchCommand = dynamic(loadSearchCommand, { ssr: false })

const preloadSearchCommand = () => {
  void loadSearchCommand()
}

interface PendingCounts {
  organizations: number
  team: number
}

interface DashboardSidebarItemProps extends React.ComponentProps<typeof SidebarMenuButton> {
  badge?: number
  icon?: IconName
  label: string
  route: Route
  subItem?: boolean
}

const DashboardSidebarBadge = ({ count }: { count: number }) => {
  const { isMobile, open } = useSidebar()
  const t = useTranslations('Layout')

  if (!open && !isMobile) {
    return (
      <span className="absolute top-1 right-1 size-2 rounded-full bg-brand">
        <span className="sr-only">{t('pendingRequests', { count })}</span>
      </span>
    )
  }

  return (
    <Badge className="size-3.75 p-0" size="sm" variant="brand">
      <span aria-hidden>{count}</span>
      <span className="sr-only">{t('pendingRequests', { count })}</span>
    </Badge>
  )
}

const DashboardSidebarItem = ({
  asChild = false,
  badge = 0,
  className,
  icon,
  label,
  onClick,
  route,
  subItem,
}: DashboardSidebarItemProps) => {
  const { activePath, setActivePath } = useSidebar()
  const searchParams = useSearchParams()

  const Component = asChild ? Fragment : subItem ? SidebarMenuSubItem : SidebarMenuItem
  const isActivePath = route === activePath && searchParams.size === 0

  const isActive = (() => {
    if (isActivePath || subItem) return isActivePath
    if (route === APP_ROOT) return activePath === APP_ROOT
    return activePath.startsWith(route)
  })()

  const setPath = (e: React.MouseEvent<HTMLButtonElement>) => {
    setActivePath(route)
    onClick?.(e)
  }

  return (
    <Component>
      <SidebarMenuButton
        active={isActive}
        asChild
        className={cn(
          'select-none',
          subItem
            ? 'border-transparent px-2.75 py-1.5 text-[13px] text-sidebar-foreground/60 hover:text-sidebar-foreground data-active:text-sidebar-foreground data-active:text-stroke'
            : 'px-2.25 py-3 font-medium data-active:bg-brand/10 hover:data-active:bg-brand/12',
          isActivePath && 'pointer-events-none',
          badge > 0 && 'relative',
          className
        )}
        onClick={setPath}
        tooltip={label}
      >
        <Link href={route}>
          {route === APP_ROOT ? (
            <DashboardIcon className="size-4" colored />
          ) : icon ? (
            <LucideIcon
              className={cn('text-muted-foreground/80 transition-colors', isActive && 'text-brand-text')}
              name={icon}
            />
          ) : null}
          {label}
          {badge > 0 && <DashboardSidebarBadge count={badge} />}
        </Link>
      </SidebarMenuButton>
    </Component>
  )
}

const DashboardSidebarCollapsible = ({ badge = 0, children, icon, label, route }: DashboardSidebarItemProps) => {
  const { activePath } = useSidebar()
  const [open, setOpen] = useState(() => activePath.startsWith(route))

  return (
    <Collapsible asChild open={open}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <DashboardSidebarItem
            asChild
            badge={open ? 0 : badge}
            icon={icon}
            label={label}
            onClick={() => !open && setOpen(true)}
            route={route}
          />
        </CollapsibleTrigger>
        <CollapsibleTrigger asChild>
          <SidebarMenuAction
            className="cursor-pointer data-[state=open]:rotate-90"
            onClick={() => setOpen(prev => !prev)}
          >
            <LucideIcon className="text-foreground/64" name="chevron-right" />
          </SidebarMenuAction>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>{children}</SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

const DashboardSidebarMain = ({ pending }: { pending: PendingCounts }) => {
  const { user } = useSession()
  const labels = useNavigationLabels()
  const t = useTranslations('Layout')
  const viewer: NavigationViewer = { canEdit: user.canEdit, isAdmin: user.isAdmin, role: user.role }
  const adminEntries = entriesFor(viewer, 'admin')

  return (
    <SidebarGroup>
      <SidebarMenu className="mt-4 gap-3">
        {sidebarEntriesFor(viewer).map(({ href, icon, id }) => (
          <DashboardSidebarItem icon={icon} key={id} label={labels[id]} route={href} />
        ))}
        {/* <DashboardSidebarCollapsible icon="message-circle-question" label={t('docs')} route="/docs">
          <DashboardSidebarItem label={t('docsIntro')} route="/docs/intro" subItem />
          <DashboardSidebarItem label={t('docsTutorials')} route="/docs/tutorials" subItem />
          <DashboardSidebarItem label={t('docsFaq')} route="/docs/faq" subItem />
        </DashboardSidebarCollapsible> */}
        {adminEntries.length > 0 && (
          <DashboardSidebarCollapsible
            badge={pending.organizations + pending.team}
            icon="cog"
            label={t('admin')}
            route="/admin"
          >
            {adminEntries.map(({ href, id }) => (
              <DashboardSidebarItem
                badge={id === 'admin-team' ? pending.team : id === 'admin-organizations' ? pending.organizations : 0}
                key={id}
                label={labels[id]}
                route={href}
                subItem
              />
            ))}
          </DashboardSidebarCollapsible>
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}

const DashboardSidebarUserItem = ({
  children,
  href,
  icon,
  onClick,
}: React.PropsWithChildren<{
  href: Route
  icon: IconName
  onClick: () => void
}>) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <Suspense fallback={<DropdownMenuItem disabled>{children}</DropdownMenuItem>}>
      <Link href={href} onClick={onClick}>
        <DropdownMenuItem
          className={cn(
            pathname === href && 'bg-accent/50',
            href === pathname && searchParams.size === 0 && 'pointer-events-none'
          )}
        >
          <LucideIcon name={icon} />
          {children}
        </DropdownMenuItem>
      </Link>
    </Suspense>
  )
}

const DashboardSidebarUser = ({ organization }: { organization: UserOrganization | null }) => {
  const tCommon = useTranslations('Common')
  const t = useTranslations('Layout')

  const { open, openMobile, setOpenMobile } = useSidebar()
  const { user } = useSession()

  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const onLinkClick = () => {
    setMenuOpen(false)
    if (openMobile) {
      setOpenMobile(false)
    }
  }

  const onLogoutClick = async () => {
    setLogoutDialogOpen(true)
    setLoggingOut(true)

    try {
      await logout()
    } catch {
      toast.error(t('logoutFailed'))
      setLoggingOut(false)
      return
    }

    await sleep(500)
    setTimeout(() => setMenuOpen(false), 1000)
    redirect(`${AUTH_ROOT}?loggedOut=true`)
  }

  useEffect(
    () => () => {
      setLoggingOut(false)
      setLogoutDialogOpen(false)
    },
    []
  )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu onOpenChange={setMenuOpen} open={menuOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className={cn(
                'group/sidebar-user overflow-visible rounded-lg border bg-popover py-7 shadow-2xs transition-all duration-150 hover:bg-accent/50',
                'data-[state=open]:bg-accent/50 data-[state=open]:text-foreground data-[state=open]:shadow-inner'
              )}
              size="lg"
              variant="outline"
            >
              <div className="relative ml-0 transition-all duration-150">
                <Avatar
                  className={cn(
                    'aspect-square size-8 rounded-lg border border-transparent',
                    !user.avatarUrl && 'border-border'
                  )}
                >
                  {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                  <AvatarFallback className="text-muted-foreground">{user.initials}</AvatarFallback>
                </Avatar>
                {organization?.avatarUrl && (
                  <Image
                    className="absolute -right-1 -bottom-1 rounded-full object-cover"
                    height={14}
                    src={organization.avatarUrl}
                    width={14}
                  />
                )}
              </div>
              <div className={cn('grid flex-1 text-left text-sm leading-tight', !open && 'hidden')}>
                <span className="flex items-center gap-1 font-semibold">
                  {user.firstName}
                  {user.isAdmin && (
                    <Tooltip>
                      <TooltipTrigger
                        asChild
                        className="group-aria-expanded/sidebar-user:pointer-events-none!"
                        pointerEvents="auto"
                      >
                        <span>
                          <LucideIcon className="size-3" name="shield-user" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent sideOffset={6} size="sm">
                        <span className="text-xs">{t('adminUser')}</span>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {user.isEditor && (
                    <Tooltip>
                      <TooltipTrigger
                        asChild
                        className="group-aria-expanded/sidebar-user:pointer-events-none!"
                        pointerEvents="auto"
                      >
                        <span>
                          <LucideIcon className="size-3" name="pencil" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent sideOffset={6} size="sm">
                        <span className="text-xs">{t('editorUser')}</span>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </span>
                <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
              </div>
              <Button
                asChild
                className={cn(
                  'ml-auto flex size-6 items-center justify-center border border-transparent transition-none hover:border-border',
                  !open && 'hidden'
                )}
                variant="ghost"
              >
                <span>
                  <LucideIcon className="size-4 stroke-foreground/64" name="chevrons-up-down" />
                </span>
              </Button>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg pt-2"
            side="top"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DashboardSidebarUserItem href="/settings" icon="settings" onClick={onLinkClick}>
                {t('settings')}
              </DashboardSidebarUserItem>
              <DropdownMenuItem as="div" className="justify-between" variant="flat">
                <span className="flex items-center gap-2">
                  <LucideIcon name="palette" />
                  {tCommon('theme')}
                </span>
                <ThemeSwitch />
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DashboardSidebarUserItem href="/help" icon="circle-help" onClick={onLinkClick}>
                {t('help')}
              </DashboardSidebarUserItem>
              <DashboardSidebarUserItem href="/about" icon="info" onClick={onLinkClick}>
                {t('about')}
              </DashboardSidebarUserItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup className="p-1">
              <AlertDialog onOpenChange={setLogoutDialogOpen} open={logoutDialogOpen}>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={e => e.preventDefault()} variant="destructive">
                    <LucideIcon name="log-out" />
                    {t('logout')}
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('logoutConfirmTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('logoutConfirmMessage')}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={loggingOut}>{t('logoutCancel')}</AlertDialogCancel>
                    <Button
                      className="transition-colors"
                      loading={loggingOut}
                      loadingText={t('logoutLoading')}
                      onClick={onLogoutClick}
                      variant="destructive"
                    >
                      {t('logoutConfirm')}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

const DashboardSidebarSearch = () => {
  const t = useTranslations('Search')
  const tLayout = useTranslations('Layout')
  const [open, setOpen] = useState(false)
  const [activated, setActivated] = useState(false)

  const openSearch = () => {
    setActivated(true)
    setOpen(true)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === settings.searchShortcut) {
        e.preventDefault()
        setActivated(true)
        setOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={openSearch}
              onFocus={preloadSearchCommand}
              onPointerEnter={preloadSearchCommand}
              tooltip={t('trigger')}
            >
              <LucideIcon name="search" />
              <span className="flex flex-1 items-center justify-between">
                {t('trigger')}
                <kbd className="flex items-center gap-0.5 font-mono text-[13px] text-muted-foreground/70">
                  <span className="text-[15px]">{'⌘'}</span>
                  <span>{settings.searchShortcut.toUpperCase()}</span>
                </kbd>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <NotificationBell className={cn(sidebarMenuButtonVariants(), 'justify-start font-normal')}>
              <span>{tLayout('notifications')}</span>
            </NotificationBell>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      {activated && <SearchCommand onOpenChange={setOpen} open={open} />}
    </>
  )
}

export const DashboardSidebar = ({ pending }: { pending: PendingCounts }) => {
  const { organization, user } = useSession()

  return (
    <Sidebar collapsible="icon">
      {showsOrganizationSwitcher(user) && (
        <SidebarHeader>
          <OrganizationSwitcher />
        </SidebarHeader>
      )}
      <SidebarContent>
        <DashboardSidebarSearch />
        <DashboardSidebarMain pending={pending} />
      </SidebarContent>
      <SidebarFooter>
        <DashboardSidebarUser organization={organization} />
      </SidebarFooter>
      <SidebarRail className="-mr-1" tabIndex={-1} />
    </Sidebar>
  )
}
