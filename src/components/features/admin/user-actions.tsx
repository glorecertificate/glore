'use client'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type AdminUserRow, PLATFORM_ROLES, type PlatformRole, isBanActive } from '@/db/queries/admin-user'
import { type IconName } from '@/lib/types'

import { userLabel } from './utils'

const ROLE_ICONS = {
  admin: 'shield-user',
  editor: 'pencil',
  user: 'user',
} as const satisfies Record<PlatformRole, IconName>

export const UserActions = ({
  busy,
  onBan,
  onImpersonate,
  onRole,
  onUnban,
  user,
}: {
  busy: boolean
  onBan: (user: AdminUserRow) => void
  onImpersonate: (user: AdminUserRow) => void
  onRole: (user: AdminUserRow, role: PlatformRole) => void
  onUnban: (user: AdminUserRow) => void
  user: AdminUserRow
}) => {
  const t = useTranslations('Admin.users')
  const banned = isBanActive(user)
  const isAdmin = user.platformRole === 'admin'
  const canImpersonate = !(isAdmin || banned) && Boolean(user.onboardedAt)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label={`${t('actions')}: ${userLabel(user)}`} disabled={busy} size="icon" variant="ghost">
          <LucideIcon name="ellipsis" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {PLATFORM_ROLES.flatMap(role =>
          role === user.platformRole
            ? []
            : [
                <DropdownMenuItem key={role} onSelect={() => onRole(user, role)}>
                  <LucideIcon name={ROLE_ICONS[role]} />
                  {t('makeRole', { role: t(`role_${role}`) })}
                </DropdownMenuItem>,
              ]
        )}
        <DropdownMenuSeparator />
        {canImpersonate && (
          <DropdownMenuItem onSelect={() => onImpersonate(user)}>
            <LucideIcon name="eye" />
            {t('impersonate')}
          </DropdownMenuItem>
        )}
        {banned && (
          <DropdownMenuItem onSelect={() => onUnban(user)}>
            <LucideIcon name="user-round-check" />
            {t('unban')}
          </DropdownMenuItem>
        )}
        {!(banned || isAdmin) && (
          <DropdownMenuItem onSelect={() => onBan(user)} variant="destructive">
            <LucideIcon name="ban" />
            {t('ban')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
