'use client'

import { redirect } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { titleize } from '@repo/utils'
import { ChevronRightIcon, ChevronsUpDownIcon, HelpCircleIcon, LogOutIcon, PlusIcon, SettingsIcon } from 'lucide-react'
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
import { useDB } from '@/hooks/use-db'
import { useNavigation, type Page, type Section } from '@/hooks/use-navigation'
import { Route } from '@/lib/routes'
import { Cookie } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { type Auth, type User } from '@/services/db'

export const OrgSwitch = ({ items }: { items: User['orgs'] }) => {
  const { isMobile, open } = useSidebar()
  const t = useTranslations('Navigation')

  const [activeOrg, setActiveOrg] = useState(items.find(org => org.isActive) || items[0])

  const onOrgSelect = useCallback((org: User['orgs'][number]) => {
    setActiveOrg(org)
    document.cookie = `${Cookie.CurrentOrg}=${org.id}; path=/; max-age=31536000`
  }, [])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="justify-center data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              size="lg"
            >
              {activeOrg.avatar_url && (
                <Image className="aspect-square size-2 rounded-lg border" src={activeOrg.avatar_url} width={40} />
              )}
              {open && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{activeOrg.name}</span>
                    <span className="truncate text-xs font-normal text-muted-foreground">{titleize(activeOrg.role)}</span>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto" />
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
  color,
  isActive,
  isActivePage,
  path,
  title,
  ...props
}: React.ComponentProps<typeof SidebarMenuButton> & Page) => {
  const { openMobile, setOpenMobile } = useSidebar()
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!isActive) {
      setActive(false)
    }
  }, [isActive])

  const onClick = useCallback(() => {
    setActive(true)

    if (openMobile) {
      setOpenMobile(false)
    }
  }, [openMobile, setOpenMobile])

  const isHighlighted = useMemo(() => {
    if (isActivePage) return true
    if (isActive) return true
    if (active) return true
    return false
  }, [active, isActive, isActivePage])

  return (
    <SidebarMenuButton asChild isActive={isHighlighted} isActivePage={isActivePage} onClick={onClick} tooltip={title} {...props}>
      <DashboardLink color={color} to={path}>
        {Icon && <Icon className={cn(color && `text-${color}`)} />}
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
              <NavButton className="font-medium" onClick={toggleCollapsible} {...page} />
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
                        loader={false}
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
          <NavButton className="font-medium" {...page} />
        )}
      </SidebarMenuItem>
    </Collapsible>
  )
}

const NavSection = ({ pages }: Section) => (
  <SidebarGroup>
    <SidebarMenu className="mt-4">
      {pages.map(page => (
        <NavCollapsible key={page.title} {...page} />
      ))}
    </SidebarMenu>
  </SidebarGroup>
)

const NavUser = ({ auth, user }: { auth: Auth; user: User }) => {
  const t = useTranslations('Common')

  const initials = useMemo(() => {
    if (!user.name) return ''
    return user.name
      .split(' ')
      .map(name => name[0])
      .join('')
  }, [user])

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
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              size="lg"
            >
              <Avatar className="relative h-8 w-8 overflow-visible">
                <AvatarImage alt={user.name} className="rounded-lg" src={user.avatar_url} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                {user.currentOrg.avatar_url && (
                  <Image
                    alt="logo"
                    className="absolute -right-1 -bottom-1 rounded-full"
                    height={14}
                    objectFit="cover"
                    src={user.currentOrg.avatar_url}
                    width={14}
                  />
                )}
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[--radix-dropdown-menu-trigger-width] min-w-68 rounded-lg"
            side="top"
            sideOffset={4}
          >
            {/* <DropdownMenuLabel className="p-1 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage alt={user.name} src={user.avatar_url} />
                  <AvatarFallback>{initials}</AvatarFallback>
                  <div className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-background ring-2 ring-background">
                    <Image
                      alt="logo"
                      className="rounded-full"
                      height={13}
                      objectFit="cover"
                      src={user.currentOrg.avatar_url}
                      width={13}
                    />
                  </div>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator /> */}
            <DropdownMenuGroup>
              <DashboardLink to={Route.Settings}>
                <DropdownMenuItem>
                  <SettingsIcon />
                  {t('settings')}
                </DropdownMenuItem>
              </DashboardLink>
              <DashboardLink to={Route.Help}>
                <DropdownMenuItem>
                  <HelpCircleIcon />
                  {t('help')}
                </DropdownMenuItem>
              </DashboardLink>
              <DropdownMenuItem onClick={logOutUser}>
                <LogOutIcon />
                {t('logout')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup className="p-1">
              <div className="flex items-center px-1.5 py-1">
                <span className="text-[13px] leading-[16px] font-medium text-muted-foreground">{t('preferences')}</span>
              </div>
            </DropdownMenuGroup>
            <DropdownMenuGroup className="p-1 pt-0">
              <div className="flex h-10 w-full items-center justify-between gap-4 px-1.5">
                <span className="text-sm font-normal text-foreground">{t('theme')}</span>
                <div data-orientation="horizontal" dir="ltr">
                  <ThemeSwitch />
                </div>
              </div>
              <div className="flex h-10 w-full items-center justify-between gap-4 px-1.5">
                <span className="text-sm font-normal text-foreground">{t('language')}</span>
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
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  defaultOpen?: boolean
  user: User
}) => {
  const { auth } = useDB()
  const { routes } = useNavigation()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrgSwitch items={user.orgs} />
      </SidebarHeader>
      <SidebarContent>
        <NavSection pages={routes.dashboard} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser auth={auth} user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
