'use client'

import { redirect } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  AudioWaveformIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  CommandIcon,
  GalleryVerticalEndIcon,
  HelpCircleIcon,
  LogOutIcon,
  PlusIcon,
  SettingsIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import { DashboardButton } from '@/components/dashboard/button'
import { DashboardLink } from '@/components/dashboard/link'
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
  DropdownMenuShortcut,
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
import { cn } from '@/lib/utils'
import { type AuthClient, type Profile, type User } from '@/services/db'

export const OrgSwitch = ({
  items,
}: {
  items: {
    logo: React.ElementType
    name: string
    role: string
  }[]
}) => {
  const { isMobile, open } = useSidebar()
  const [activeOrg, setActiveOrg] = useState(items[0])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="justify-center data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              size="lg"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <activeOrg.logo className="size-4" />
              </div>
              {open && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{activeOrg.name}</span>
                    <span className="truncate text-xs">{activeOrg.role}</span>
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
            <DropdownMenuLabel className="text-xs text-muted-foreground">{'Teams'}</DropdownMenuLabel>
            {items.map((org, index) => (
              <DropdownMenuItem className="gap-2 p-2" key={org.name} onClick={() => setActiveOrg(org)}>
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <org.logo className="size-4 shrink-0" />
                </div>
                {org.name}
                <DropdownMenuShortcut>
                  {'⌘'}
                  {index + 1}
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <PlusIcon className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">{'Add org'}</div>
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

const NavUser = ({ auth, profile }: { auth: AuthClient; profile?: Profile }) => {
  const t = useTranslations('Common')

  const initials = useMemo(() => {
    if (!profile?.name) return ''
    return profile.name
      .split(' ')
      .map(name => name[0])
      .join('')
  }, [profile])

  const avatarUrl = useMemo(() => profile?.avatar_url || undefined, [profile?.avatar_url])

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
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage alt={profile?.name} src={avatarUrl} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{profile?.name}</span>
                <span className="truncate text-xs">{'Volunteer @ Joint 🌍'}</span>
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
            <DropdownMenuLabel className="p-1 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg transition-opacity hover:cursor-pointer hover:opacity-80">
                  <AvatarImage alt={profile?.name} src={avatarUrl} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  <div className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-background ring-2 ring-background">
                    <Image alt="logo" className="rounded-full" height={13} objectFit="cover" src="/logo.svg" width={13} />
                  </div>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{profile?.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{profile?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
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
  user: User | null
}) => {
  const { routes } = useNavigation()
  const db = useDB()

  const [profile, setProfile] = useState<Profile | undefined>(undefined)

  const orgs = useMemo(
    () => [
      {
        name: 'Acme Inc',
        logo: GalleryVerticalEndIcon,
        role: 'Learner',
      },
      {
        name: 'Acme Corp.',
        logo: AudioWaveformIcon,
        role: 'Tutor',
      },
      {
        name: 'Evil Corp.',
        logo: CommandIcon,
        role: 'Admin',
      },
    ],
    [],
  )

  const setUserProfile = useCallback(async () => {
    if (!user?.id) return

    const { data, error, status } = await db.from('profiles').select().eq('uuid', user.id).single()

    if (error && status !== 406) {
      console.error(error)
      throw error
    }

    if (data) {
      setProfile({
        ...data,
        name: `${data.first_name} ${data.last_name}`,
      })
    }
  }, [db, user?.id])

  useEffect(() => {
    void setUserProfile()
  }, [setUserProfile])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrgSwitch items={orgs} />
      </SidebarHeader>
      <SidebarContent>
        <NavSection pages={routes.dashboard} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser auth={db.auth} profile={profile} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
