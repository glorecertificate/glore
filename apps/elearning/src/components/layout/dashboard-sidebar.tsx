'use client'

import { redirect } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { titleize } from '@repo/utils'
import { ChevronRightIcon, ChevronsUpDownIcon, HelpCircleIcon, InfoIcon, LogOutIcon, PlusIcon, SettingsIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { DashboardButton } from '@/components/layout/dashboard-button'
import { DashboardLink } from '@/components/layout/dashboard-link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { type ButtonProps } from '@/components/ui/button'
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
import { type User } from '@/services/db'

export const NavOrgs = ({ items }: { items: User['orgs'] }) => {
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
              {activeOrg.avatar_url && (
                <Image className="aspect-square size-2 rounded-lg border" src={activeOrg.avatar_url} width={40} />
              )}
              {open && (
                <>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-semibold">{activeOrg.name}</span>
                    <span className="truncate text-xs font-normal text-muted-foreground">{titleize(activeOrg.role)}</span>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto size-4" />
                </>
              )}
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
              <DropdownMenuItem className="gap-2 p-2" key={org.id} onClick={onOrgSelect.bind(null, org)}>
                {org.avatar_url && <Image className="aspect-square size-2 rounded-lg border" src={org.avatar_url} width={40} />}
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
              <div className="font-medium text-muted-foreground">{t('addOrganization')}</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

const NavButton = ({
  Icon,
  className,
  color,
  isActive,
  isActivePage,
  path,
  title,
  ...props
}: React.ComponentProps<typeof SidebarMenuButton> & Page) => {
  const { state } = useProgressBar()
  const { isMobile, openMobile, setOpenMobile } = useSidebar()
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

  return (
    <SidebarMenuButton
      asChild
      className={cn('text-sm', className)}
      isActive={isHighlighted}
      isActivePage={isActivePage}
      onClick={onClick}
      tooltip={title}
      {...props}
    >
      <DashboardLink color={color} hasLoader={!isMobile} to={path}>
        {Icon && <Icon className={cn('size-4', color && `text-${color}`)} />}
        <span>{title}</span>
      </DashboardLink>
    </SidebarMenuButton>
  )
}

const NavCollapsible = ({
  defaultOpen,
  ...page
}: Page & {
  defaultOpen?: boolean
}) => {
  const [open, setOpen] = useState(page.isActive || defaultOpen)

  const toggleCollapsible = useCallback(() => {
    setOpen(prev => !prev)
  }, [])

  return (
    <Collapsible asChild className="group/collapsible" defaultOpen={page.isActive} key={page.title} open={open}>
      <SidebarMenuItem>
        {page.subPages?.length ? (
          <>
            <CollapsibleTrigger asChild>
              <NavButton onClick={toggleCollapsible} {...page} />
            </CollapsibleTrigger>
            <CollapsibleTrigger asChild>
              <SidebarMenuAction className="cursor-pointer data-[state=open]:rotate-90">
                <ChevronRightIcon />
              </SidebarMenuAction>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {page.subPages.map(subPage => (
                  <SidebarMenuSubItem key={subPage.title}>
                    {subPage.type === 'button' ? (
                      <DashboardButton
                        className={cn(subPage.isActive && 'pointer-events-none cursor-default', 'mt-1 w-full text-sm')}
                        color={page.color}
                        size="sm"
                        to={subPage.path}
                        variant={(page.color ? page.color : 'outline') as ButtonProps['variant']}
                      >
                        {subPage.title}
                      </DashboardButton>
                    ) : (
                      <NavButton
                        className={cn(
                          'border-l-2 border-transparent text-sidebar-foreground/70 hover:text-sidebar-foreground data-[active=true]:rounded-tl-none data-[active=true]:rounded-bl-none data-[active=true]:border-sidebar-border',
                          page.color && `data-[active=true]:border-${page.color}`,
                        )}
                        color={page.color}
                        {...subPage}
                        isActivePage={subPage.isActive}
                      />
                    )}
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </>
        ) : (
          <NavButton {...page} />
        )}
      </SidebarMenuItem>
    </Collapsible>
  )
}

const NavSection = () => {
  const { routes } = useNavigation()

  return (
    <SidebarGroup>
      <SidebarMenu className="mt-4">
        {routes.dashboard.map(page => (
          <NavCollapsible key={page.title} {...page} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

const NavUser = ({ user }: { user: User }) => {
  const { auth } = useDB()
  const { open } = useSidebar()
  const t = useTranslations()

  const initials = useMemo(() => {
    if (!user.name) return ''
    return user.name
      .split(' ')
      .map(name => name[0])
      .join('')
  }, [user])

  const currentOrg = useMemo(() => user.orgs.find(org => org.isActive), [user])

  const logOutUser = useCallback(async () => {
    await auth.signOut()
    redirect(Route.Login)
  }, [auth])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="py-7 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              size="lg"
            >
              <Avatar className="relative size-8 overflow-visible">
                <AvatarImage alt={user.name} className="overflow-visible rounded-lg" src={user.avatar_url} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                {currentOrg?.avatar_url && (
                  <Image
                    alt={currentOrg.name}
                    className="absolute -right-1 -bottom-1 rounded-full object-cover"
                    height={14}
                    src={currentOrg.avatar_url}
                    width={14}
                  />
                )}
              </Avatar>
              {open && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs font-normal text-muted-foreground">{user.username}</span>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto size-4" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[--radix-dropdown-menu-trigger-width] min-w-68 rounded-lg pt-2"
            side="top"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DashboardLink to={Route.Settings}>
                <DropdownMenuItem>
                  <SettingsIcon />
                  {t('Navigation.settings')}
                </DropdownMenuItem>
              </DashboardLink>
              <DashboardLink to={Route.Help}>
                <DropdownMenuItem>
                  <HelpCircleIcon />
                  {t('Navigation.help')}
                </DropdownMenuItem>
              </DashboardLink>
              <DashboardLink to={Route.About}>
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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavOrgs items={user.orgs} />
      </SidebarHeader>
      <SidebarContent>
        <NavSection />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
