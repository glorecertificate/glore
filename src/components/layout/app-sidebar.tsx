'use client'

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { redirect, useRouter } from 'next/navigation'
import { type AppRoutes } from 'next/types/routes'

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
  PaletteIcon,
  PencilIcon,
  PlusIcon,
  SettingsIcon,
  ShieldUserIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { logout } from '@/actions/auth'
import { setCookie } from '@/actions/cookies'
import { DashboardIcon } from '@/components/icons/dashboard-icon'
import { useSession } from '@/components/providers/session-provider'
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
import { Button } from '@/components/ui/button'
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
  type SidebarMenuButtonProps,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { ThemeSwitch } from '@/components/ui/theme-switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type UserOrganization } from '@/db/schema/users'
import { APP_ROOT, AUTH_ROOT } from '@/lib/constants'
import { metadata } from '@/lib/metadata'
import { type Icon } from '@/lib/types'
import { cn, sleep, titleize } from '@/lib/utils'

interface SidebarItemProps extends SidebarMenuButtonProps {
  icon?: Icon
  label: string
  route: AppRoutes
  subItem?: boolean
}

const AppSidebarItem = ({
  asChild = false,
  className,
  icon: Icon,
  label,
  onClick,
  route,
  subItem,
}: SidebarItemProps) => {
  const { activePath, setActivePath } = useSidebar()

  const Component = useMemo(
    () => (asChild ? Fragment : subItem ? SidebarMenuSubItem : SidebarMenuItem),
    [asChild, subItem]
  )

  const isActivePath = route === activePath

  const isActive = useMemo(() => {
    if (isActivePath || subItem) return isActivePath
    if (route === APP_ROOT) return activePath === APP_ROOT
    return activePath.startsWith(route)
  }, [isActivePath, subItem, route, activePath])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      setActivePath(route)
      onClick?.(e)
    },
    [onClick, route, setActivePath]
  )

  return (
    <Component>
      <SidebarMenuButton
        asChild
        className={cn(
          cn(
            subItem ? 'text-[13px]' : 'py-4 font-medium',
            subItem &&
              'border-transparent border-l-2 py-1.5 text-sidebar-foreground/70 hover:text-sidebar-foreground data-[active=true]:rounded-l-none data-[active=true]:border-sidebar-border',
            className
          ),
          isActivePath && 'pointer-events-none'
        )}
        isActive={isActive}
        onClick={handleClick}
        tooltip={label}
      >
        <Link href={route} prefetch>
          {route === APP_ROOT ? (
            <DashboardIcon className="size-4" colored />
          ) : Icon ? (
            <Icon className={cn('text-muted-foreground', isActive && 'text-sidebar-accent-foreground')} />
          ) : null}
          {label}
        </Link>
      </SidebarMenuButton>
    </Component>
  )
}

const AppSidebarCollapsible = ({ children, icon, label, route }: SidebarItemProps) => {
  const { activePath } = useSidebar()
  const [open, setOpen] = useState(activePath.startsWith(route))

  return (
    <Collapsible asChild open={open}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <AppSidebarItem asChild icon={icon} label={label} onClick={() => !open && setOpen(true)} route={route} />
        </CollapsibleTrigger>
        <CollapsibleTrigger asChild>
          <SidebarMenuAction
            className={cn('cursor-pointer data-[state=open]:rotate-90')}
            onClick={() => setOpen(open => !open)}
          >
            <ChevronRightIcon className="stroke-foreground/64" />
          </SidebarMenuAction>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>{children}</SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

const AppSidebarOrgs = ({ organization }: { organization: UserOrganization }) => {
  const { setOrganization, user } = useSession()
  const router = useRouter()
  const { isMobile, open, setActivePath } = useSidebar()
  const t = useTranslations('Layout')

  const onOrgSelect = useCallback(
    (org: UserOrganization) => {
      setActivePath(APP_ROOT)
      setTimeout(async () => {
        setOrganization(org)
        await setCookie('org', org.id)
      }, 200)
      router.push(APP_ROOT)
    },
    [router, setActivePath, setOrganization]
  )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              asChild
              className={
                'justify-center overflow-visible rounded-lg py-7 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground peer-data-[state=collapsed]:border'
              }
              size="lg"
            >
              <Avatar
                className={cn(
                  'flex aspect-square size-10 items-center justify-center overflow-hidden rounded-lg bg-muted transition-all duration-150',
                  !open && 'size-8 text-xs',
                  !organization.avatar_url && 'border'
                )}
              >
                {organization.avatar_url ? (
                  <AvatarImage alt={organization.name} src={organization.avatar_url} />
                ) : (
                  <span className="text-muted-foreground">{organization.name.slice(0, 2).toUpperCase()}</span>
                )}
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">{organization.name}</span>
                <span className="truncate font-normal text-muted-foreground text-xs">
                  {titleize(organization.role)}
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4 stroke-foreground/64" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">{t('organizations')}</DropdownMenuLabel>
            {user.organizations.map(org => (
              <DropdownMenuItem className="gap-2 p-2" key={org.id} onClick={onOrgSelect.bind(null, org)}>
                <Avatar className="aspect-square size-10 rounded-lg border">
                  {org.avatar_url && <AvatarImage alt={org.avatar_url} src={org.avatar_url} />}
                  <AvatarFallback className="text-muted-foreground">
                    {org.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="flex items-center truncate font-semibold">
                    {org.name}
                    {org.id === organization.id && (
                      <span className="mt-[1.5px] ml-1.5 inline-block size-1.75 rounded-full bg-green-500" />
                    )}
                  </span>
                  <span className="truncate font-normal text-muted-foreground text-xs">{titleize(org.role)}</span>
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

const AppSidebarMain = () => {
  const { user } = useSession()
  const t = useTranslations('Layout')

  const showCertificates = useMemo(() => !user.canEdit, [user.canEdit])

  return (
    <SidebarGroup>
      <SidebarMenu className="mt-4 gap-3">
        <AppSidebarItem label={t('dashboard')} route="/dashboard" />
        <AppSidebarItem icon={BookOpenIcon} label={t('courses')} route="/courses" />
        {showCertificates && <AppSidebarItem icon={AwardIcon} label={t('certificates')} route="/certificates" />}
        <AppSidebarCollapsible icon={MessageCircleQuestionIcon} label={t('docs')} route="/docs">
          <AppSidebarItem label={t('docsIntro')} route="/docs/intro" subItem />
          <AppSidebarItem label={t('docsTutorials')} route="/docs/tutorials" subItem />
          <AppSidebarItem label={t('docsFaq')} route="/docs/faq" subItem />
        </AppSidebarCollapsible>
        {user.is_admin && <AppSidebarItem icon={CogIcon} label={t('admin')} route="/admin" />}
      </SidebarMenu>
    </SidebarGroup>
  )
}

const AppSidebarUser = ({ organization }: { organization?: UserOrganization }) => {
  const router = useRouter()
  const tCommon = useTranslations('Common')
  const t = useTranslations('Layout')

  const { open, openMobile, setOpenMobile } = useSidebar()
  const { user } = useSession()

  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  const onLinkClick = useCallback(() => {
    if (openMobile) {
      setOpenMobile(false)
    }
  }, [openMobile, setOpenMobile])

  const onLogoutClick = useCallback(async () => {
    setLogoutDialogOpen(true)

    setLoggingOut(true)
    onLinkClick()

    try {
      await logout()
      router.push(AUTH_ROOT)
    } catch {
      toast.error(t('logoutFailed'))
      setLoggingOut(false)
      return
    }

    await sleep(500)
    redirect(AUTH_ROOT)
  }, [onLinkClick, t, router.push])

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className={cn(
                'group/sidebar-user overflow-hidden rounded-lg border bg-popover py-7 shadow-inner transition-all duration-150 hover:bg-accent/50'
              )}
              size="lg"
              variant="outline"
            >
              <div className={cn('relative overflow-visible transition-all duration-150', open ? 'ml-0' : 'ml-8')}>
                <Avatar
                  className={cn(
                    'aspect-square size-8 rounded-lg border',
                    !open && 'text-xs',
                    !user.avatar_url && 'border'
                  )}
                >
                  {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                  <AvatarFallback className="text-muted-foreground">{user.initials}</AvatarFallback>
                </Avatar>
                {organization?.avatar_url && (
                  <Image
                    className="absolute -right-1 -bottom-1 rounded-full object-cover"
                    height={14}
                    src={organization.avatar_url}
                    width={14}
                  />
                )}
              </div>
              <div className={cn('grid flex-1 text-left text-sm leading-tight', !open && 'hidden')}>
                <span className="flex items-center gap-1 font-semibold">
                  {user.first_name}
                  {user.is_admin && (
                    <Tooltip>
                      <TooltipTrigger
                        asChild
                        className="group-aria-expanded/sidebar-user:pointer-events-none!"
                        pointerEvents="auto"
                      >
                        <ShieldUserIcon className="size-3" />
                      </TooltipTrigger>
                      <TooltipContent sideOffset={3}>
                        <span className="text-xs">{t('adminUser')}</span>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {user.is_editor && (
                    <Tooltip>
                      <TooltipTrigger
                        asChild
                        className="group-aria-expanded/sidebar-user:pointer-events-none!"
                        pointerEvents="auto"
                      >
                        <PencilIcon className="size-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <span className="text-xs">{t('editorUser')}</span>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </span>
                <span className="truncate font-normal text-muted-foreground text-xs">{user.email}</span>
              </div>
              <Button
                asChild
                className={cn(
                  'ml-auto flex size-6 items-center justify-center border border-transparent transition-none hover:border-border',
                  !open && 'invisible'
                )}
                variant="ghost"
              >
                <span>
                  <ChevronsUpDownIcon className="size-4 stroke-foreground/64" />
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
              <Link href="/settings" onClick={onLinkClick}>
                <DropdownMenuItem>
                  <SettingsIcon />
                  {t('settings')}
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem as="div" className="justify-between" variant="flat">
                <span className="flex items-center gap-2">
                  <PaletteIcon />
                  {tCommon('theme')}
                </span>
                <ThemeSwitch />
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link href="/help" onClick={onLinkClick}>
                <DropdownMenuItem>
                  <HelpCircleIcon />
                  {t('help')}
                </DropdownMenuItem>
              </Link>
              <Link href="/about" onClick={onLinkClick}>
                <DropdownMenuItem>
                  <InfoIcon />
                  {t('about')}
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup className="p-1">
              <AlertDialog onOpenChange={setLogoutDialogOpen} open={logoutDialogOpen}>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={e => e.preventDefault()} variant="destructive">
                    <LogOutIcon />
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
                      {t('logoutConfirm', { app: metadata.applicationName })}
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

export const AppSidebar = () => {
  const { organization } = useSession()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>{organization && <AppSidebarOrgs organization={organization} />}</SidebarHeader>
      <SidebarContent>
        <AppSidebarMain />
      </SidebarContent>
      <SidebarFooter>
        <AppSidebarUser organization={organization} />
      </SidebarFooter>
      <SidebarRail tabIndex={-1} />
    </Sidebar>
  )
}
