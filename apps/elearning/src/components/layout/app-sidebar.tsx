'use client'

import { redirect } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

import { ChevronRightIcon, ChevronsUpDownIcon, HelpCircleIcon, InfoIcon, LogOutIcon, PlusIcon, SettingsIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { titleize } from '@repo/utils'

import { type User, type UserOrg } from '@/api'
import { AppLink } from '@/components/layout/app-link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AppRouteIcon } from '@/components/ui/icon'
import { Image } from '@/components/ui/image'
import { LanguageSelect } from '@/components/ui/language-select'
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
  useSidebar,
  type SidebarMenuButtonProps,
} from '@/components/ui/sidebar'
import { ThemeSwitch } from '@/components/ui/theme-switch'
import { useDashboard } from '@/hooks/use-dashboard'
import { useDB } from '@/hooks/use-db'
import { useNavigation } from '@/hooks/use-navigation'
import { Path, type Route } from '@/lib/navigation'
import { Cookie, setCookie } from '@/lib/storage'
import { cn } from '@/lib/utils'

export const SidebarOrgs = ({ items }: { items: User['orgs'] }) => {
  const { isMobile, open } = useSidebar()
  const t = useTranslations('Navigation')

  const [activeOrg, setActiveOrg] = useState(items.find(org => org.isActive) || items[0])

  const getOrgInitials = useCallback((org: UserOrg) => org.name.charAt(0).toUpperCase(), [])

  const onOrgSelect = useCallback((org: User['orgs'][number]) => {
    setActiveOrg(org)
    setCookie(Cookie.CurrentOrg, org.id)
  }, [])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="justify-center py-7 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              size="lg"
            >
              <Avatar
                className={cn(
                  'aspect-square size-10 overflow-hidden rounded-lg border transition-all duration-150',
                  !open && 'ml-8',
                )}
              >
                {activeOrg.avatar_url && <AvatarImage alt={activeOrg.avatar_url} src={activeOrg.avatar_url} />}
                <AvatarFallback className="text-muted-foreground">{getOrgInitials(activeOrg)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">{activeOrg.name}</span>
                <span className="truncate text-xs font-normal text-muted-foreground">{titleize(activeOrg.role)}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4 stroke-foreground/64" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">{t('organizations')}</DropdownMenuLabel>
            {items.map(org => (
              <DropdownMenuItem
                className={cn('gap-2 p-2', org.isActive && 'bg-accent/50')}
                key={org.id}
                onClick={onOrgSelect.bind(null, org)}
              >
                <Avatar className="aspect-square size-10 rounded-lg border">
                  {org.avatar_url && <AvatarImage alt={org.avatar_url} src={org.avatar_url} />}
                  <AvatarFallback className="text-muted-foreground">{getOrgInitials(org)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{org.name}</span>
                  <span className="truncate text-xs font-normal text-muted-foreground">{titleize(org.role)}</span>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <PlusIcon className="size-4" />
              </div>
              <div className="font-normal text-muted-foreground">{t('addOrganization')}</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

const SidebarNavigationButton = ({
  className,
  color,
  disabled,
  icon,
  isActive,
  path,
  title,
  ...props
}: SidebarMenuButtonProps & Pick<Route, 'color' | 'icon' | 'path' | 'title'>) => {
  const { openMobile, setOpenMobile } = useSidebar()

  const onClick = useCallback(() => {
    if (openMobile) {
      setOpenMobile(false)
    }
  }, [openMobile, setOpenMobile])

  return (
    <SidebarMenuButton
      asChild
      className={cn('text-sm', className)}
      isActive={isActive}
      onClick={onClick}
      tooltip={title}
      variant="default"
      {...props}
    >
      <AppLink color={color} to={path}>
        {icon && <AppRouteIcon className="size-4" color={color} name={icon} />}
        <span>{title}</span>
      </AppLink>
    </SidebarMenuButton>
  )
}

const SidebarNavigationItem = ({
  currentRoute,
  route,
  setCurrentRoute,
  ...props
}: {
  currentRoute: Route
  route: Route & {
    subRoutes: Route[]
  }
  setCurrentRoute: (route: Route) => void
}) => {
  const isActiveRoute = useMemo(() => route.path === currentRoute.path, [currentRoute.path, route.path])

  const isActiveSection = useMemo(() => {
    if (isActiveRoute) return true
    if (route.subRoutes?.some(subRoute => currentRoute.path.startsWith(subRoute.path))) return true
    return false
  }, [currentRoute.path, isActiveRoute, route.subRoutes])

  const [open, setOpen] = useState(isActiveSection)

  const onItemClick = useCallback(
    (route: Route) => () => {
      setCurrentRoute(route)
    },
    [setCurrentRoute],
  )

  const toggleCollapsible = useCallback(() => setOpen(open => !open), [])

  const onCollapsibleClick = useCallback(
    (e: React.MouseEvent) => {
      setCurrentRoute(route)
      if (!isActiveSection && open) {
        e.stopPropagation()
        e.preventDefault()
        return
      }
      toggleCollapsible()
    },
    [isActiveSection, route, open, setCurrentRoute, toggleCollapsible],
  )

  const isActiveSubRoute = useCallback((path: Path) => path === currentRoute.path, [currentRoute.path])

  return (
    <Collapsible asChild className="group/collapsible" open={open}>
      <SidebarMenuItem>
        {route.subRoutes?.length ? (
          <>
            <CollapsibleTrigger asChild>
              <SidebarNavigationButton
                color={route.color}
                disabled={isActiveRoute}
                icon={route.icon}
                isActive={isActiveSection}
                onClick={onCollapsibleClick}
                path={route.path}
                title={route.title}
                {...props}
              />
            </CollapsibleTrigger>
            <CollapsibleTrigger asChild>
              <SidebarMenuAction
                className={cn('cursor-pointer data-[state=open]:rotate-90', isActiveSection && 'hover:border')}
                onClick={toggleCollapsible}
              >
                <ChevronRightIcon className="stroke-foreground/64" />
              </SidebarMenuAction>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {route.subRoutes.map(subRoute => {
                  const isActivePath = isActiveSubRoute(subRoute.path)

                  return (
                    <SidebarMenuSubItem key={subRoute.path}>
                      <SidebarNavigationButton
                        className={cn(
                          'border-l-2 border-transparent py-1.5 text-[13px] text-sidebar-foreground/70 hover:text-sidebar-foreground',
                          isActivePath &&
                            'rounded-tl-none data-[active=true]:rounded-bl-none data-[active=true]:border-sidebar-border',
                          isActivePath && route.color && `border-${route.color}`,
                        )}
                        color={route.color}
                        disabled={isActivePath}
                        isActive={isActivePath}
                        onClick={onItemClick(subRoute)}
                        path={subRoute.path}
                        title={subRoute.title}
                        {...props}
                      />
                    </SidebarMenuSubItem>
                  )
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </>
        ) : (
          <SidebarNavigationButton
            color={route.color}
            disabled={isActiveRoute}
            icon={route.icon}
            isActive={isActiveSection}
            onClick={onItemClick(route)}
            path={route.path}
            title={route.title}
            {...props}
          />
        )}
      </SidebarMenuItem>
    </Collapsible>
  )
}

const SidebarNavigation = () => {
  const { route: navigationRoute, routes } = useNavigation()

  const [currentRoute, setCurrentRoute] = useState<Route>(navigationRoute)

  const menuRoutes = useMemo(
    () =>
      routes.reduce<
        (Route & {
          subRoutes: Route[]
        })[]
      >((acc, route) => {
        if (route.sidebar === false) return acc

        const parts = route.path.slice(1).split('/')
        if (parts.length > 1) return acc

        return [
          ...acc,
          {
            ...route,
            subRoutes: routes.filter(subRoute => !subRoute.path.includes(':') && subRoute.path.startsWith(`${route.path}/`)),
          },
        ]
      }, []),
    [routes],
  )

  return (
    <SidebarGroup>
      <SidebarMenu className="mt-4">
        {menuRoutes.map(route => (
          <SidebarNavigationItem currentRoute={currentRoute} key={route.path} route={route} setCurrentRoute={setCurrentRoute} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

const SidebarUser = ({ user }: { user: User }) => {
  const { auth } = useDB()
  const { open, openMobile, setOpenMobile } = useSidebar()
  const t = useTranslations()

  const currentOrg = useMemo(() => user.orgs.find(org => org.isActive), [user])
  const initials = useMemo(
    () =>
      user.name
        .split(' ')
        .map(name => name[0])
        .join('') || '',
    [user],
  )

  const onLinkClick = useCallback(() => {
    if (openMobile) {
      setOpenMobile(false)
    }
  }, [openMobile, setOpenMobile])

  const logOutUser = useCallback(async () => {
    onLinkClick()
    await auth.signOut()
    redirect(Path.Login)
  }, [auth, onLinkClick])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className={cn(
                'py-7 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
                open ? 'overflow-hidden' : 'overflow-visible',
              )}
              size="lg"
            >
              <div className={cn('relative overflow-visible transition-all duration-150', open ? 'ml-0' : 'ml-8')}>
                <Avatar className="aspect-square size-8 rounded-lg border">
                  <AvatarImage alt={user.name} src={user.avatar_url} />
                  <AvatarFallback className="text-muted-foreground">{initials}</AvatarFallback>
                </Avatar>
                {currentOrg?.avatar_url && (
                  <Image
                    alt={currentOrg.name}
                    className="absolute -right-1 -bottom-1 rounded-full object-cover"
                    height={14}
                    src={currentOrg.avatar_url}
                    width={14}
                  />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs font-normal text-muted-foreground">{user.username}</span>
              </div>
              <ChevronsUpDownIcon className={cn('ml-auto size-4 stroke-foreground/64 leading-tight', !open && 'invisible')} />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[--radix-dropdown-menu-trigger-width] min-w-68 rounded-lg pt-2"
            side="top"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <AppLink onClick={onLinkClick} to={Path.Settings}>
                <DropdownMenuItem>
                  <SettingsIcon />
                  {t('Navigation.settings')}
                </DropdownMenuItem>
              </AppLink>
              <AppLink onClick={onLinkClick} to={Path.Help}>
                <DropdownMenuItem>
                  <HelpCircleIcon />
                  {t('Navigation.help')}
                </DropdownMenuItem>
              </AppLink>
              <AppLink onClick={onLinkClick} to={Path.About}>
                <DropdownMenuItem>
                  <InfoIcon />
                  {t('Navigation.about')}
                </DropdownMenuItem>
              </AppLink>
              <DropdownMenuItem onClick={logOutUser}>
                <LogOutIcon />
                {t('Navigation.logout')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup className="p-1">
              <div className="flex items-center px-1.5 py-1">
                <span className="text-[13px] leading-[16px] font-medium text-muted-foreground">{t('Common.preferences')}</span>
              </div>
            </DropdownMenuGroup>
            <DropdownMenuGroup className="p-1 pt-0">
              <div className="flex h-10 w-full items-center justify-between gap-4 px-1.5">
                <span className="text-sm font-normal text-foreground">{t('Common.theme')}</span>
                <div data-orientation="horizontal" dir="ltr">
                  <ThemeSwitch />
                </div>
              </div>
              <div className="flex h-10 w-full items-center justify-between gap-4 px-1.5">
                <span className="text-sm font-normal text-foreground">{t('Common.language')}</span>
                <div data-orientation="horizontal" dir="ltr">
                  <LanguageSelect className="h-8 px-2" />
                </div>
              </div>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export const AppSidebar = ({
  defaultOpen,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  defaultOpen?: boolean
}) => {
  const { user } = useDashboard()

  return (
    <Sidebar className="overflow-hidden" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarOrgs items={user.orgs} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarNavigation />
      </SidebarContent>
      <SidebarFooter>
        <SidebarUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
