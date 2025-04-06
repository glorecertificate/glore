'use client'

import { redirect } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { ChevronRightIcon, ChevronsUpDownIcon, HelpCircleIcon, InfoIcon, LogOutIcon, PlusIcon, SettingsIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { titleize } from '@repo/utils'

import { type User, type UserOrg } from '@/api'
import { DashboardButton } from '@/components/layout/dashboard-button'
import { DashboardLink } from '@/components/layout/dashboard-link'
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
import { Image } from '@/components/ui/image'
import { LanguageSelect } from '@/components/ui/language-select'
import { ProgressBarState } from '@/components/ui/progress-bar'
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
} from '@/components/ui/sidebar'
import { ThemeSwitch } from '@/components/ui/theme-switch'
import { useDashboard } from '@/hooks/use-dashboard'
import { useDB } from '@/hooks/use-db'
import { useNavigation, type Page } from '@/hooks/use-navigation'
import { useProgressBar } from '@/hooks/use-progress-bar'
import { Route } from '@/lib/navigation'
import { Cookie, setCookie } from '@/lib/storage'
import { cn } from '@/lib/utils'

const orgInitial = (org: UserOrg) => org.name.charAt(0).toUpperCase()

export const DashboardSidebarOrgs = ({ items }: { items: User['orgs'] }) => {
  const { isMobile, open } = useSidebar()
  const t = useTranslations('Navigation')

  const [activeOrg, setActiveOrg] = useState(items.find(org => org.isActive) || items[0])

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
                <AvatarFallback className="text-muted-foreground">{orgInitial(activeOrg)}</AvatarFallback>
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
                {/* {org.avatar_url && <Image className="aspect-square size-2 rounded-lg border" src={org.avatar_url} width={40} />} */}
                <Avatar className="aspect-square size-10 rounded-lg border">
                  {org.avatar_url && <AvatarImage alt={org.avatar_url} src={org.avatar_url} />}
                  <AvatarFallback className="text-muted-foreground">{orgInitial(org)}</AvatarFallback>
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

const DashboardSidebarButton = ({
  Icon,
  className,
  color,
  isActive,
  isActivePage,
  path,
  title,
  ...props
}: React.ComponentProps<typeof SidebarMenuButton> & Partial<Page>) => {
  const { state } = useProgressBar()
  const { openMobile, setOpenMobile } = useSidebar()
  const [isNewPage, setIsNewPage] = useState(false)

  useEffect(() => {
    if (state !== ProgressBarState.InProgress) {
      setIsNewPage(false)
    }
  }, [state])

  const onClick = useCallback(() => {
    setIsNewPage(true)

    if (openMobile) {
      setOpenMobile(false)
    }
  }, [openMobile, setOpenMobile])

  const isHighlighted = useMemo(() => {
    if (state === ProgressBarState.InProgress) {
      return isNewPage
    }
    return isActivePage || isActive
  }, [isActive, isActivePage, isNewPage, state])

  const iconClass = useMemo(() => {
    if (!color) return ''
    if (color === 'muted') return 'text-muted-foreground'
    return `text-${color}`
  }, [color])

  return (
    <SidebarMenuButton
      asChild
      className={cn('text-sm', className)}
      isActive={isHighlighted}
      isActivePage={isActivePage}
      onClick={onClick}
      tooltip={title}
      variant="default"
      {...props}
    >
      <DashboardLink color={color} iconSize={14} to={path as Route}>
        {Icon && <Icon className={cn('size-4', iconClass)} />}
        <span>{title}</span>
      </DashboardLink>
    </SidebarMenuButton>
  )
}

const DashboardSidebarCollapsible = ({
  color,
  defaultOpen,
  isActive,
  subPages,
  title,
  ...page
}: Partial<Page> & {
  defaultOpen?: boolean
}) => {
  const [open, setOpen] = useState(isActive || defaultOpen)

  const toggleCollapsible = useCallback(() => {
    setOpen(prev => !prev)
  }, [])

  return (
    <Collapsible asChild className="group/collapsible" defaultOpen={isActive} key={title} open={open}>
      <SidebarMenuItem>
        {subPages?.length ? (
          <>
            <CollapsibleTrigger asChild>
              <DashboardSidebarButton color={color} onClick={toggleCollapsible} title={title} {...page} />
            </CollapsibleTrigger>
            <CollapsibleTrigger asChild>
              <SidebarMenuAction className="cursor-pointer data-[state=open]:rotate-90">
                <ChevronRightIcon className="stroke-foreground/64" />
              </SidebarMenuAction>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {subPages.map(subPage => (
                  <SidebarMenuSubItem key={subPage.title}>
                    {subPage.type === 'button' ? (
                      <DashboardButton
                        className={cn(subPage.isActive && 'pointer-events-none cursor-default', 'mt-1 w-full text-sm')}
                        color={color}
                        size="sm"
                        to={subPage.path}
                      >
                        {subPage.title}
                      </DashboardButton>
                    ) : (
                      <DashboardSidebarButton
                        className={cn(
                          'border-l-2 border-transparent text-sidebar-foreground/70 hover:text-sidebar-foreground data-[active=true]:rounded-tl-none data-[active=true]:rounded-bl-none data-[active=true]:border-sidebar-border',
                          color && `data-[active=true]:border-${color}`,
                        )}
                        color={color}
                        {...subPage}
                        isActivePage={subPage.isActive}
                        title={subPage.title}
                      />
                    )}
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </>
        ) : (
          <DashboardSidebarButton color={color} title={title} {...page} isActivePage={isActive} />
        )}
      </SidebarMenuItem>
    </Collapsible>
  )
}

const DashboardSidebarSection = () => {
  const { routes } = useNavigation()

  return (
    <SidebarGroup>
      <SidebarMenu className="mt-4">
        {routes.dashboard.map(page => (
          <DashboardSidebarCollapsible key={page.title} {...page} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

const DashboardSidebarUser = ({ user }: { user: User }) => {
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
    redirect(Route.Login)
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
              <DashboardLink onClick={onLinkClick} to={Route.Settings}>
                <DropdownMenuItem>
                  <SettingsIcon />
                  {t('Navigation.settings')}
                </DropdownMenuItem>
              </DashboardLink>
              <DashboardLink onClick={onLinkClick} to={Route.Help}>
                <DropdownMenuItem>
                  <HelpCircleIcon />
                  {t('Navigation.help')}
                </DropdownMenuItem>
              </DashboardLink>
              <DashboardLink onClick={onLinkClick} to={Route.About}>
                <DropdownMenuItem>
                  <InfoIcon />
                  {t('Navigation.about')}
                </DropdownMenuItem>
              </DashboardLink>
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

export const DashboardSidebar = ({
  defaultOpen,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  defaultOpen?: boolean
}) => {
  const { user } = useDashboard()

  return (
    <Sidebar className="overflow-hidden" collapsible="icon" {...props}>
      <SidebarHeader>
        <DashboardSidebarOrgs items={user.orgs} />
      </SidebarHeader>
      <SidebarContent>
        <DashboardSidebarSection />
      </SidebarContent>
      <SidebarFooter>
        <DashboardSidebarUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
