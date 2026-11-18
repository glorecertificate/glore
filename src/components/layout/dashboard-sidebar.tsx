'use client'

import { Route } from 'next'
import dynamic from 'next/dynamic'
import { redirect, usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'

import { logout } from '@/actions/auth'
import { NotificationBell } from '@/components/features/notifications/notification-bell'
import { LucideIcon } from '@/components/icons/lucide'
import {
  type NavigationViewer,
  adminSectionHref,
  entriesFor,
  showsOrganizationSwitcher,
  sidebarEntriesFor,
} from '@/components/layout/navigation'
import { OrganizationSwitcher } from '@/components/layout/organization-switcher'
import { SidebarCount } from '@/components/layout/sidebar-count'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HeaderLogo } from '@/components/ui/header'
import { Image } from '@/components/ui/image'
import { KbdShortcut } from '@/components/ui/kbd-shortcut'
import { Link } from '@/components/ui/link'
import { Logo } from '@/components/ui/logo'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  sidebarMenuButtonVariants,
  useSidebar,
} from '@/components/ui/sidebar'
import { ThemeSwitch } from '@/components/ui/theme-switch'
import { toast } from '@/components/ui/toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type UserOrganization } from '@/db/queries/user'
import { useShortcut } from '@/hooks/use-shortcut'
import { APP_ROOT, AUTH_ROOT } from '@/lib/constants'
import { SHORTCUTS } from '@/lib/shortcuts'
import { type IconName } from '@/lib/types'
import { cn, sleep } from '@/lib/utils'

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
  exact?: boolean
  icon?: IconName
  label: string
  route: Route
}

const DashboardSidebarBadge = ({ count }: { count: number }) => {
  const t = useTranslations('Layout')

  return <SidebarCount count={count} label={t('pendingRequests', { count })} />
}

const DashboardSidebarItem = ({
  badge = 0,
  className,
  exact,
  icon,
  label,
  onClick,
  route,
}: DashboardSidebarItemProps) => {
  const { activePath, setActivePath } = useSidebar()
  const searchParams = useSearchParams()

  const isActivePath = route === activePath && searchParams.size === 0

  const isActive = (() => {
    if (isActivePath || exact) return isActivePath
    if (route === APP_ROOT) return activePath === APP_ROOT
    return activePath.startsWith(route)
  })()

  const setPath = (e: React.MouseEvent<HTMLButtonElement>) => {
    setActivePath(route)
    onClick?.(e)
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        active={isActive}
        asChild
        className={cn('select-none', isActivePath && 'pointer-events-none', badge > 0 && 'relative', className)}
        onClick={setPath}
        tooltip={label}
      >
        <Link href={route} prefetch>
          {icon && <LucideIcon name={icon} />}
          {label}
          {badge > 0 && <DashboardSidebarBadge count={badge} />}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

const DashboardSidebarMain = ({ pending }: { pending: PendingCounts }) => {
  const { user } = useSession()
  const labels = useNavigationLabels()
  const t = useTranslations('Layout')
  const viewer: NavigationViewer = { canEdit: user.canEdit, isAdmin: user.isAdmin, role: user.role }
  const adminEntries = entriesFor(viewer, 'admin')
  const adminHref = adminSectionHref(viewer)

  return (
    <SidebarGroup>
      <SidebarMenu>
        {sidebarEntriesFor(viewer).map(({ href, icon, id }) => (
          <DashboardSidebarItem icon={icon} key={id} label={labels[id]} route={href} />
        ))}
        {/* <DashboardSidebarCollapsible icon="message-circle-question" label={t('docs')} route="/docs">
          <DashboardSidebarItem label={t('docsIntro')} route="/docs/intro" subItem />
          <DashboardSidebarItem label={t('docsTutorials')} route="/docs/tutorials" subItem />
          <DashboardSidebarItem label={t('docsFaq')} route="/docs/faq" subItem />
        </DashboardSidebarCollapsible> */}
      </SidebarMenu>
      {adminHref && (
        <div className="mt-6 flex flex-col gap-1">
          <SidebarGroupLabel>{t('admin')}</SidebarGroupLabel>
          <SidebarMenu>
            {adminEntries.map(({ href, icon, id }) => (
              <DashboardSidebarItem
                badge={id === 'admin-team' ? pending.team : id === 'admin-organizations' ? pending.organizations : 0}
                exact
                icon={icon}
                key={id}
                label={labels[id]}
                route={href}
              />
            ))}
          </SidebarMenu>
        </div>
      )}
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
    <Suspense
      fallback={
        <DropdownMenuItem disabled>
          <LucideIcon name={icon} />
          {children}
        </DropdownMenuItem>
      }
    >
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
  const collapsed = !open

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
      await logout({ loggedOut: true })
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
                'group/sidebar-user overflow-visible rounded-xl bg-sidebar-field py-7 transition-[background-color,color] duration-100',
                'hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent'
              )}
              size="lg"
              variant="outline"
            >
              <div className="relative ml-0 transition-[margin] duration-150">
                <Avatar className={cn('aspect-square size-8 rounded-full border border-transparent')}>
                  {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                  <AvatarFallback className="bg-avatar font-bold text-band-action-foreground">
                    {user.initials}
                  </AvatarFallback>
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
              {collapsed && <span className="sr-only">{user.firstName}</span>}
              <div className={cn('grid flex-1 text-left text-sm leading-tight', !open && 'hidden')}>
                <span className="flex items-center gap-1 font-semibold text-sidebar-accent-foreground">
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
                <span className="truncate text-xs font-normal text-sidebar-muted">{user.email}</span>
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
                  <LucideIcon className="size-4 stroke-sidebar-muted" name="chevrons-up-down" />
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

  useShortcut(SHORTCUTS.search, () => {
    setActivated(true)
    setOpen(prev => !prev)
  })

  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="border border-sidebar-border bg-sidebar-field text-sidebar-muted"
              onClick={openSearch}
              onFocus={preloadSearchCommand}
              onPointerEnter={preloadSearchCommand}
              tooltip={t('trigger')}
            >
              <LucideIcon name="search" />
              <span className="flex flex-1 items-center justify-between">
                {t('trigger')}
                <KbdShortcut shortcut={SHORTCUTS.search} />
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

const DashboardSidebarBrand = () => {
  const { user } = useSession()
  const t = useTranslations('Layout')

  return (
    <div className="flex items-center justify-between gap-2 px-1 group-data-[collapsible=icon]:hidden">
      <HeaderLogo className="inline-flex rounded-lg logo-chip px-2.5 py-1.5" href={APP_ROOT} prefetch={false}>
        <Logo className="h-4.5 w-auto" />
      </HeaderLogo>
      {user.isAdmin && (
        <Badge className="bg-sidebar-badge text-sidebar-badge-foreground" variant="ghost">
          {t('admin')}
        </Badge>
      )}
    </div>
  )
}

export const DashboardSidebar = ({ pending }: { pending: PendingCounts }) => {
  const { organization, user } = useSession()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-4 p-4 pb-2">
        <DashboardSidebarBrand />
        {showsOrganizationSwitcher(user) && <OrganizationSwitcher />}
      </SidebarHeader>
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
