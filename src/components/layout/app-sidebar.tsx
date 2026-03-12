'use client'

import { Route } from 'next'
import { redirect, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'

import {
  AwardIcon,
  BookOpenIcon,
  Building2Icon,
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
import { DashboardIcon } from '@/components/icons/dashboard'
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
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { ThemeSwitch } from '@/components/ui/theme-switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type UserOrganization } from '@/db/queries/user'
import { useSession } from '@/hooks/use-session'
import { APP_ROOT, AUTH_ROOT } from '@/lib/constants'
import { type Icon } from '@/lib/types'
import { cn, sleep, titleize } from '@/lib/utils'

interface AppSidebarItemProps extends React.ComponentProps<typeof SidebarMenuButton> {
  icon?: Icon
  label: string
  route: Route
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
}: AppSidebarItemProps) => {
  const { activePath, setActivePath } = useSidebar()
  const searchParams = useSearchParams()

  const Component = useMemo(
    () => (asChild ? Fragment : subItem ? SidebarMenuSubItem : SidebarMenuItem),
    [asChild, subItem]
  )

  const isActivePath = useMemo(() => route === activePath && searchParams.size === 0, [route, activePath, searchParams])

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
        active={isActive}
        asChild
        className={cn(
          subItem
            ? 'border-l-2 border-transparent py-1.5 text-[13px] text-sidebar-foreground/60 hover:text-sidebar-foreground data-active:rounded-l-none data-active:border-border/50 data-active:font-medium data-active:text-sidebar-foreground'
            : 'py-3 font-medium data-active:shadow-[inset_3px_0_0_var(--color-primary)]',
          isActivePath && 'pointer-events-none',
          className
        )}
        onClick={handleClick}
        tooltip={label}
      >
        <Link href={route} prefetch>
          {route === APP_ROOT ? (
            <DashboardIcon className="size-4" colored />
          ) : Icon ? (
            <Icon className={cn('text-muted-foreground/80 transition-colors', isActive && 'text-foreground/80')} />
          ) : null}
          {label}
        </Link>
      </SidebarMenuButton>
    </Component>
  )
}

const AppSidebarCollapsible = ({ children, icon, label, route }: AppSidebarItemProps) => {
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
            className="cursor-pointer data-[state=open]:rotate-90"
            onClick={() => setOpen(open => !open)}
          >
            <ChevronRightIcon className="text-foreground/64" />
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
  const router = useRouter()
  const { isMobile, open, setActivePath } = useSidebar()
  const t = useTranslations('Layout')

  const { setOrganization, user } = useSession()

  const membership = useMemo(
    () => user.memberships.find(membership => membership.organization.id === organization.id),
    [user.memberships, organization.id]
  )

  const selectOrganization = useCallback(
    (id: number) => {
      setActivePath(APP_ROOT)
      setOrganization(id)
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
              className="justify-center overflow-visible rounded-lg py-7 peer-data-[state=collapsed]:border data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              size="lg"
            >
              <Avatar
                className={cn(
                  'flex aspect-square size-10 items-center justify-center overflow-hidden rounded-lg bg-muted transition-all duration-150',
                  !open && 'size-8 text-xs',
                  !organization.avatarUrl && 'border'
                )}
              >
                {organization.avatarUrl ? (
                  <AvatarImage alt={organization.name} src={organization.avatarUrl} />
                ) : (
                  <span className="text-muted-foreground">{organization.name.slice(0, 2).toUpperCase()}</span>
                )}
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">{organization.name}</span>
                {membership?.role && (
                  <span className="truncate text-xs font-normal text-muted-foreground">
                    {titleize(membership.role)}
                  </span>
                )}
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
            <DropdownMenuLabel className="text-xs text-muted-foreground">{t('organizations')}</DropdownMenuLabel>
            {user.memberships.map(({ organization: { id, avatarUrl, name }, role }) => (
              <DropdownMenuItem className="gap-2 p-2" key={id} onClick={() => selectOrganization(id)}>
                <Avatar className="aspect-square size-10 rounded-lg border">
                  {avatarUrl && <AvatarImage alt={name} src={avatarUrl} />}
                  <AvatarFallback className="text-muted-foreground">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="flex items-center truncate font-semibold">
                    {name}
                    {id === organization.id && (
                      <span className="mt-[1.5px] ml-1.5 inline-block size-1.75 rounded-full bg-green-500" />
                    )}
                  </span>
                  <span className="truncate text-xs font-normal text-muted-foreground">{titleize(role)}</span>
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

  return (
    <SidebarGroup>
      <SidebarMenu className="mt-4 gap-3">
        <AppSidebarItem label={t('dashboard')} route="/dashboard" />
        {(user.isOrgAdmin || user.isRepresentative) && (
          <AppSidebarItem icon={Building2Icon} label={t('organization')} route={'/organization' as Route} />
        )}
        <AppSidebarItem icon={BookOpenIcon} label={t('courses')} route="/courses" />
        {!user.canEdit && <AppSidebarItem icon={AwardIcon} label={t('certificates')} route="/certificates" />}
        <AppSidebarCollapsible icon={MessageCircleQuestionIcon} label={t('docs')} route="/docs">
          <AppSidebarItem label={t('docsIntro')} route="/docs/intro" subItem />
          <AppSidebarItem label={t('docsTutorials')} route="/docs/tutorials" subItem />
          <AppSidebarItem label={t('docsFaq')} route="/docs/faq" subItem />
        </AppSidebarCollapsible>
        {user.isAdmin && <AppSidebarItem icon={CogIcon} label={t('admin')} route="/admin" />}
      </SidebarMenu>
    </SidebarGroup>
  )
}

const AppSidebarUserItem = ({
  children,
  href,
  icon: Icon,
  onClick,
}: React.PropsWithChildren<{
  href: Route
  icon: Icon
  onClick: () => void
}>) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <Link href={href} onClick={onClick}>
      <DropdownMenuItem
        className={cn(
          pathname === href && 'bg-accent/50',
          href === pathname && searchParams.size === 0 && 'pointer-events-none'
        )}
      >
        <Icon />
        {children}
      </DropdownMenuItem>
    </Link>
  )
}

const AppSidebarUser = ({ organization }: { organization: UserOrganization | null }) => {
  const tCommon = useTranslations('Common')
  const t = useTranslations('Layout')

  const { open, openMobile, setOpenMobile } = useSidebar()
  const { user } = useSession()

  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const onLinkClick = useCallback(() => {
    setMenuOpen(false)
    if (openMobile) {
      setOpenMobile(false)
    }
  }, [openMobile, setOpenMobile])

  const onLogoutClick = useCallback(async () => {
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
    redirect(AUTH_ROOT)
  }, [t])

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
                'group/sidebar-user overflow-hidden rounded-lg border bg-popover py-7 shadow-xs transition-all duration-150 hover:bg-accent/50 data-[state=open]:bg-accent/50 data-[state=open]:text-foreground data-[state=open]:shadow-inner'
              )}
              size="lg"
              variant="outline"
            >
              <div className="relative ml-0 overflow-visible transition-all duration-150">
                <Avatar className={cn('aspect-square size-8 rounded-lg border', !user.avatarUrl && 'border')}>
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
                        <ShieldUserIcon className="size-3" />
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
                        <PencilIcon className="size-3" />
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
              <AppSidebarUserItem href="/settings" icon={SettingsIcon} onClick={onLinkClick}>
                {t('settings')}
              </AppSidebarUserItem>
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
              <AppSidebarUserItem href="/help" icon={HelpCircleIcon} onClick={onLinkClick}>
                {t('help')}
              </AppSidebarUserItem>
              <AppSidebarUserItem href="/about" icon={InfoIcon} onClick={onLinkClick}>
                {t('about')}
              </AppSidebarUserItem>
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
