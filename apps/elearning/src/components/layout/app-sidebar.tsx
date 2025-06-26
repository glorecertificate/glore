'use client'

import { redirect, useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

import {
  AwardIcon,
  BookOpenIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  CogIcon,
  HelpCircleIcon,
  InfoIcon,
  LogOutIcon,
  MessageCircleQuestionIcon,
  PencilIcon,
  PlusIcon,
  SettingsIcon,
  ShieldUserIcon,
} from 'lucide-react'

import { titleize } from '@repo/utils'

import { type UserOrganization } from '@/api/modules/organizations/types'
import { type User } from '@/api/modules/users/types'
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
import { DashboardIcon } from '@/components/ui/icons/dashboard'
import { Image } from '@/components/ui/image'
import { LanguageSelect } from '@/components/ui/language-select'
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
  useSidebar,
} from '@/components/ui/sidebar'
import { ThemeSwitch } from '@/components/ui/theme-switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useCookies } from '@/hooks/use-cookies'
import { usePathname } from '@/hooks/use-pathname'
import { useSession } from '@/hooks/use-session'
import { useTranslations } from '@/hooks/use-translations'
import { db } from '@/lib/db/client'
import { Route, type Pathname } from '@/lib/navigation'
import { Cookie } from '@/lib/storage'
import { cn } from '@/lib/utils'

export const SidebarOrgs = ({
  currentOrg,
  orgs,
  setOrg,
}: {
  currentOrg: UserOrganization
  orgs: UserOrganization[]
  setOrg: (org: UserOrganization) => void
}) => {
  const { setPathname } = usePathname()
  const router = useRouter()
  const { isMobile, open } = useSidebar()
  const t = useTranslations('Navigation')
  const { setCookie } = useCookies()

  const getOrgInitials = useCallback((org: UserOrganization) => org.name.slice(0, 2).toUpperCase(), [])

  const onOrgSelect = useCallback(
    (org: UserOrganization) => {
      setCookie(Cookie.Org, org.id)
      router.push(Route.Home)
      setPathname(Route.Home)
      setTimeout(() => {
        setOrg(org)
      }, 200)
    },
    [router, setCookie, setOrg, setPathname],
  )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className={`
                justify-center overflow-visible rounded-lg py-7
                peer-data-[state=collapsed]:border
                data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground
              `}
              size="lg"
            >
              <Avatar
                className={cn(
                  'flex aspect-square size-10 items-center justify-center overflow-hidden rounded-lg bg-muted transition-all duration-150',
                  !open && 'ml-8 size-8 text-xs',
                  !currentOrg.avatarUrl && 'border',
                )}
              >
                {currentOrg.avatarUrl ? (
                  <AvatarImage alt={currentOrg.name} src={currentOrg.avatarUrl} />
                ) : (
                  <span className="text-muted-foreground">{getOrgInitials(currentOrg)}</span>
                )}
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">{currentOrg.name}</span>
                <span className="truncate text-xs font-normal text-muted-foreground">{titleize(currentOrg.role)}</span>
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
            {orgs.map(org => (
              <DropdownMenuItem className="gap-2 p-2" key={org.id} onClick={onOrgSelect.bind(null, org)}>
                <Avatar className="aspect-square size-10 rounded-lg border">
                  {org.avatarUrl && <AvatarImage alt={org.avatarUrl} src={org.avatarUrl} />}
                  <AvatarFallback className="text-muted-foreground">{getOrgInitials(org)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="flex items-center truncate font-semibold">
                    {org.name}
                    {org.id === currentOrg.id && (
                      <span className="mt-[1.5px] ml-1.5 inline-block size-[7px] rounded-full bg-green-500"></span>
                    )}
                  </span>
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

const SidebarNavigation = () => {
  const { pathname, setPathname } = usePathname()
  const { user } = useSession()
  const t = useTranslations('Navigation')

  const [docsCollapsibleOpen, setDocsCollapsibleOpen] = useState(pathname.startsWith(Route.Docs))

  const onButtonClick = useCallback(
    (path: Pathname) => () => {
      setPathname(path)
    },
    [setPathname],
  )

  const isActivePath = useCallback(
    (path: Pathname) => {
      if (path === pathname) return true
      if (path === Route.Home) return pathname === Route.Home
      return pathname.startsWith(path)
    },
    [pathname],
  )
  const isClickable = useCallback((path: Pathname) => path !== pathname, [pathname])

  const toggleDocsCollapsible = useCallback(() => setDocsCollapsibleOpen(open => !open), [])

  const onDocsClick = useCallback(
    (e: React.MouseEvent) => {
      setPathname(Route.Docs)
      if (!isActivePath(Route.Docs) && docsCollapsibleOpen) {
        e.stopPropagation()
        e.preventDefault()
        return
      }
      toggleDocsCollapsible()
    },
    [docsCollapsibleOpen, isActivePath, setPathname, toggleDocsCollapsible],
  )

  const getSubItemClass = useCallback(
    (path: Pathname) => {
      const isActive = isActivePath(path)
      return cn(
        'border-l-2 border-transparent py-1.5 text-[13px] text-sidebar-foreground/70 hover:text-sidebar-foreground',
        isActive &&
          'rounded-tl-none border-muted-foreground data-[active=true]:rounded-bl-none data-[active=true]:border-sidebar-border',
      )
    },
    [isActivePath],
  )

  return (
    <SidebarGroup>
      <SidebarMenu className="mt-4">
        <SidebarMenuItem>
          <SidebarMenuButton
            active={isActivePath(Route.Home)}
            asChild
            clickable={isClickable(Route.Home)}
            onClick={onButtonClick(Route.Home)}
            tooltip={t('dashboard')}
          >
            <Link href={Route.Home}>
              <DashboardIcon className="size-4" colored />
              <span>{t('dashboard')}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            active={isActivePath(Route.Courses)}
            asChild
            clickable={isClickable(Route.Courses)}
            onClick={onButtonClick(Route.Courses)}
            tooltip={t('courses')}
          >
            <Link href={Route.Courses}>
              <BookOpenIcon className="size-4 text-muted-foreground" />
              <span>{t('courses')}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            active={isActivePath(Route.Certificates)}
            asChild
            clickable={isClickable(Route.Certificates)}
            onClick={onButtonClick(Route.Certificates)}
            tooltip={t('certificate')}
          >
            <Link href={Route.Certificates}>
              <AwardIcon className="size-4 text-muted-foreground" />
              <span>{t('certificate')}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <Collapsible asChild className="group/collapsible" open={docsCollapsibleOpen}>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                active={isActivePath(Route.Docs)}
                asChild
                clickable={isClickable(Route.Docs)}
                onClick={onDocsClick}
                tooltip={t('docs')}
              >
                <Link href={Route.Docs}>
                  <MessageCircleQuestionIcon className="size-4 text-muted-foreground" />
                  <span>{t('docs')}</span>
                </Link>
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleTrigger asChild>
              <SidebarMenuAction
                className={cn('cursor-pointer data-[state=open]:rotate-90', isActivePath(Route.Docs) && 'hover:border')}
                clickable={isClickable(Route.Docs)}
                onClick={toggleDocsCollapsible}
              >
                <ChevronRightIcon className="stroke-foreground/64" />
              </SidebarMenuAction>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                <SidebarMenuSubItem>
                  <SidebarMenuButton
                    active={isActivePath(Route.DocsIntro)}
                    asChild
                    className={getSubItemClass(Route.DocsIntro)}
                    clickable={isClickable(Route.DocsIntro)}
                    onClick={onButtonClick(Route.DocsIntro)}
                    tooltip={t('docsIntro')}
                  >
                    <Link href={Route.DocsIntro}>{t('docsIntro')}</Link>
                  </SidebarMenuButton>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <SidebarMenuButton
                    active={isActivePath(Route.DocsTutorials)}
                    asChild
                    className={getSubItemClass(Route.DocsTutorials)}
                    clickable={isClickable(Route.DocsTutorials)}
                    onClick={onButtonClick(Route.DocsTutorials)}
                  >
                    <Link href={Route.DocsTutorials}>{t('docsTutorials')}</Link>
                  </SidebarMenuButton>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <SidebarMenuButton
                    active={isActivePath(Route.DocsFaq)}
                    asChild
                    className={getSubItemClass(Route.DocsFaq)}
                    clickable={isClickable(Route.DocsFaq)}
                    onClick={onButtonClick(Route.DocsFaq)}
                    tooltip={t('docsFaq')}
                  >
                    <Link href={Route.DocsFaq}>{t('docsFaq')}</Link>
                  </SidebarMenuButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
        {user.isAdmin && (
          <SidebarMenuItem>
            <SidebarMenuButton
              active={isActivePath(Route.Admin)}
              asChild
              clickable={isClickable(Route.Admin)}
              onClick={onButtonClick(Route.Admin)}
              tooltip={t('admin')}
            >
              <Link href={Route.Admin}>
                <CogIcon className="size-4 text-muted-foreground" />
                <span>{t('admin')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}

const SidebarUser = ({ organization, user }: { organization?: UserOrganization; user: User }) => {
  const { auth } = db
  const { open, openMobile, setOpenMobile } = useSidebar()
  const t = useTranslations()

  const initials = useMemo(
    () =>
      `${user.firstName} ${user.lastName}`
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
                'rounded-lg py-7 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
                open ? 'overflow-hidden' : 'overflow-visible',
              )}
              size="lg"
            >
              <div className={cn('relative overflow-visible transition-all duration-150', open ? 'ml-0' : 'ml-8')}>
                <Avatar
                  className={cn(
                    'aspect-square size-8 rounded-lg border',
                    !open && 'text-xs',
                    !user.avatarUrl && 'border',
                  )}
                >
                  <AvatarImage src={user.avatarUrl!} />
                  <AvatarFallback className="text-muted-foreground">{initials}</AvatarFallback>
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
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="flex items-center gap-1 truncate font-semibold">
                  {user.firstName}
                  {user.isAdmin && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ShieldUserIcon size={14} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <span className="text-xs">{t('Navigation.adminUser')}</span>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {user.isEditor && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PencilIcon size={14} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <span className="text-xs">{t('Navigation.editorUser')}</span>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </span>
                <span className="truncate text-xs font-normal text-muted-foreground">{user.username}</span>
              </div>
              <ChevronsUpDownIcon
                className={cn('ml-auto size-4 stroke-foreground/64 leading-tight', !open && 'invisible')}
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[--radix-dropdown-menu-trigger-width] min-w-68 rounded-lg pt-2"
            side="top"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <Link href={Route.Settings} onClick={onLinkClick}>
                <DropdownMenuItem>
                  <SettingsIcon />
                  {t('Navigation.settings')}
                </DropdownMenuItem>
              </Link>
              <Link href={Route.Help} onClick={onLinkClick}>
                <DropdownMenuItem>
                  <HelpCircleIcon />
                  {t('Navigation.help')}
                </DropdownMenuItem>
              </Link>
              <Link href={Route.About} onClick={onLinkClick}>
                <DropdownMenuItem>
                  <InfoIcon />
                  {t('Navigation.about')}
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={logOutUser}>
                <LogOutIcon />
                {t('Navigation.logout')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup className="p-1">
              <div className="flex items-center px-1.5 py-1">
                <span className="text-[13px] leading-[16px] font-medium text-muted-foreground">
                  {t('Common.preferences')}
                </span>
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
  const { organization, setUser, user } = useSession()

  const setCurrentOrg = useCallback(
    (org: UserOrganization) => {
      setUser(prev => ({
        ...prev,
        current_org: org,
      }))
    },
    [setUser],
  )

  return (
    <Sidebar className="overflow-hidden" collapsible="icon" {...props}>
      <SidebarHeader>
        {organization && <SidebarOrgs currentOrg={organization} orgs={user.organizations} setOrg={setCurrentOrg} />}
      </SidebarHeader>
      <SidebarContent>
        <SidebarNavigation />
      </SidebarContent>
      <SidebarFooter>
        <SidebarUser organization={organization} user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
