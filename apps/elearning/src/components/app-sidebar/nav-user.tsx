'use client'

import { redirect } from 'next/navigation'
import { useCallback, useMemo } from 'react'

import { ChevronsUpDownIcon, HelpCircleIcon, LogOutIcon, SettingsIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
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
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { ThemeSwitch } from '@/components/ui/theme-switch'
import { Route } from '@/lib/routes'
import { type AuthClient, type Profile } from '@/services/db'

interface NavUserProps {
  auth: AuthClient
  profile?: Profile
}

export const NavUser = ({ auth, profile }: NavUserProps) => {
  const t = useTranslations('Common')
  // const { isMobile } = useSidebar()

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
              <Button href={Route.Settings}>
                <DropdownMenuItem>
                  <SettingsIcon />
                  {t('settings')}
                </DropdownMenuItem>
              </Button>
              <Button href={Route.Help}>
                <DropdownMenuItem>
                  <HelpCircleIcon />
                  {t('help')}
                </DropdownMenuItem>
              </Button>
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
