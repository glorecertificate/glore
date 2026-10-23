'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { listMyPendingInvitations } from '@/actions/shell/invitations'
import { LeaveOrganizationDialog } from '@/components/features/organization/leave-organization-dialog'
import { formatRoleLabel } from '@/components/features/organization/utils'
import { LucideIcon } from '@/components/icons/lucide'
import { showsOrganizationSwitcher } from '@/components/layout/navigation'
import { useSession } from '@/components/providers/session'
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
import { Link } from '@/components/ui/link'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { type User } from '@/db/queries/user'
import { usePoll } from '@/hooks/use-poll'
import { APP_ROOT, OPEN_INVITATION_ROOT, REGISTER_ROOT } from '@/lib/constants'
import { cn } from '@/lib/utils'

const INVITATIONS_POLL_INTERVAL = 120_000

const readInvitations = async () => {
  const { data, error } = await listMyPendingInvitations()
  if (error) throw new Error(error.message)
  return data
}

export const OrganizationSwitcher = () => {
  const { push } = useRouter()
  const { isMobile, open, setActivePath, setOpenMobile } = useSidebar()
  const t = useTranslations('Layout')
  const tOrganization = useTranslations('Organization')
  const { organization, setOrganization, setUser, user } = useSession()
  const [leaveOpen, setLeaveOpen] = useState(false)
  const { data: invitations, refresh } = usePoll(readInvitations, {
    enabled: showsOrganizationSwitcher(user),
    interval: INVITATIONS_POLL_INTERVAL,
  })

  if (!showsOrganizationSwitcher(user)) return null

  const pending = invitations ?? []
  const canLeave = Boolean(organization) && user.role !== 'admin'

  const selectOrganization = (id: number) => {
    setActivePath(APP_ROOT)
    setOrganization(id)
    push(APP_ROOT)
  }

  const closeMobile = () => setOpenMobile(false)

  const handleLeft = (next: User) => {
    setUser(next)
    const nextOrganization = next.organizations[0]
    if (nextOrganization) setOrganization(nextOrganization.id)
    setActivePath(APP_ROOT)
    push(APP_ROOT)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu onOpenChange={isOpen => isOpen && refresh()}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="overflow-hidden rounded-lg border bg-popover py-7 shadow-2xs transition-[background-color,color,box-shadow] duration-150 hover:bg-popover/50 data-[state=open]:bg-popover/30 data-[state=open]:text-foreground data-[state=open]:shadow-inner"
              size="lg"
              tooltip={organization?.name ?? t('noOrganization')}
              variant="outline"
            >
              <div className="relative">
                <Avatar
                  className={cn(
                    'flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg border border-transparent bg-muted transition-colors duration-150',
                    !organization?.avatarUrl && 'border-border'
                  )}
                >
                  {organization?.avatarUrl ? (
                    <AvatarImage alt={organization.name} src={organization.avatarUrl} />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {organization ? organization.name.slice(0, 2).toUpperCase() : <LucideIcon name="building-2" />}
                    </span>
                  )}
                </Avatar>
                {pending.length > 0 && (
                  <span className="absolute -top-1 -right-1 size-2.5 rounded-full border-2 border-popover bg-brand">
                    <span className="sr-only">{t('pendingInvitationsCount', { count: pending.length })}</span>
                  </span>
                )}
              </div>
              <div className={cn('grid flex-1 text-left leading-tight', !open && 'hidden')}>
                <span className="truncate font-semibold">{organization?.name ?? t('noOrganization')}</span>
                {organization && (
                  <span className="truncate text-xs font-normal text-muted-foreground">
                    {formatRoleLabel(organization.role, tOrganization)}
                  </span>
                )}
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
                  <LucideIcon className="size-4 stroke-foreground/64" name="chevrons-up-down" />
                </span>
              </Button>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            {user.memberships.length > 0 && (
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground">{t('organizations')}</DropdownMenuLabel>
                {user.memberships.map(({ organization: { id, name, profile }, role }) => (
                  <DropdownMenuItem className="gap-2 p-2" key={id} onClick={() => selectOrganization(id)}>
                    <Avatar className="aspect-square size-10 rounded-lg border">
                      {profile?.avatarUrl && <AvatarImage alt={name} src={profile.avatarUrl} />}
                      <AvatarFallback className="text-muted-foreground">
                        {name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="flex items-center truncate font-semibold">
                        {name}
                        {id === organization?.id && (
                          <span className="mt-[1.5px] ml-1.5 inline-block size-1.75 rounded-full bg-success" />
                        )}
                      </span>
                      <span className="truncate text-xs font-normal text-muted-foreground">
                        {formatRoleLabel(role, tOrganization)}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            )}
            {pending.length > 0 && (
              <>
                {user.memberships.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {t('pendingInvitations')}
                  </DropdownMenuLabel>
                  {pending.map(({ id, organizationName, role }) => (
                    <DropdownMenuItem asChild className="gap-2 p-2" key={id}>
                      <a href={`${OPEN_INVITATION_ROOT}/${id}`} onClick={closeMobile}>
                        <div className="flex size-6 items-center justify-center rounded-md border bg-brand/10">
                          <LucideIcon className="size-4" name="mail" />
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">{organizationName}</span>
                          <span className="truncate text-xs font-normal text-muted-foreground">
                            {t('invitedAs', { role: formatRoleLabel(role, tOrganization) })}
                          </span>
                        </div>
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 p-2">
              <Link href={REGISTER_ROOT} onClick={closeMobile}>
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <LucideIcon className="size-4" name="plus" />
                </div>
                <div className="font-normal text-muted-foreground">{t('registerOrganization')}</div>
              </Link>
            </DropdownMenuItem>
            {canLeave && organization && (
              <DropdownMenuItem className="gap-2 p-2" onSelect={() => setLeaveOpen(true)} variant="destructive">
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <LucideIcon className="size-4" name="log-out" />
                </div>
                <div className="font-normal">{t('leaveOrganizationItem', { name: organization.name })}</div>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      {canLeave && organization && (
        <LeaveOrganizationDialog
          onLeft={handleLeft}
          onOpenChange={setLeaveOpen}
          open={leaveOpen}
          organizationId={organization.id}
          organizationName={organization.name}
        />
      )}
    </SidebarMenu>
  )
}
