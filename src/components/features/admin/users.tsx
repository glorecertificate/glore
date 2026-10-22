'use client'

import { useRouter } from 'next/navigation'
import { startTransition as startNavigation, useState, useTransition } from 'react'

import { useFormatter, useTranslations } from 'next-intl'
import { debounce, useQueryStates } from 'nuqs'
import { toast } from 'sonner'

import { updateUserRole } from '@/actions/admin/users'
import { LucideIcon } from '@/components/icons/lucide'
import { useSession } from '@/components/providers/session'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { type AdminPage, type AdminUserRow, type PlatformRole, isBanActive } from '@/db/queries/admin-user'
import { timestampMillis } from '@/db/queries/organization'
import { type IconName } from '@/lib/types'
import { cn } from '@/lib/utils'

import { BanDialog } from './ban-dialog'
import { ImpersonateDialog } from './impersonate-dialog'
import { UnbanDialog } from './unban-dialog'
import { useAdminError } from './use-admin-error'
import { UserActions } from './user-actions'
import { type UsersFilterValues, UsersFilters } from './users-filters'
import { adminUsersParsers } from './users-params'
import { userInitials, userLabel } from './utils'

const ROLE_ICONS = {
  admin: 'shield-user',
  editor: 'pencil',
  user: 'user',
} as const satisfies Record<PlatformRole, IconName>

const SEARCH_DEBOUNCE_MS = 300

type Dialog = { kind: 'ban' | 'impersonate' | 'unban'; user: AdminUserRow }

export const AdminUsers = ({
  organizations,
  page,
}: {
  organizations: { id: number; name: string }[]
  page: AdminPage<AdminUserRow>
}) => {
  const t = useTranslations('Admin.users')
  const { refresh } = useRouter()
  const { dateTime } = useFormatter()
  const { user: currentUser } = useSession()
  const adminError = useAdminError()
  const [pending, startTransition] = useTransition()
  const [params, setParams] = useQueryStates(adminUsersParsers, {
    clearOnDefault: true,
    shallow: false,
    startTransition,
  })
  const [search, setSearch] = useState(params.q)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtersActive = Boolean(params.banned || params.org || params.q || params.role || params.status)

  const handleSearch = (value: string) => {
    setSearch(value)
    setParams({ page: 1, q: value }, { limitUrlUpdates: debounce(SEARCH_DEBOUNCE_MS) })
  }

  const handleFilter = (patch: Partial<UsersFilterValues>) => setParams({ ...patch, page: 1 })

  const handleClear = () => {
    setSearch('')
    setParams({ banned: null, org: null, page: 1, q: null, role: null, status: null })
  }

  const handleRole = async (user: AdminUserRow, role: PlatformRole) => {
    setBusyId(user.id)
    const { error } = await updateUserRole(user.id, role)
    setBusyId(null)

    if (error) {
      toast.error(adminError(error.code))
      return
    }

    toast.success(t('roleUpdateSuccess', { name: userLabel(user), role: t(`role_${role}`) }))
    startNavigation(refresh)
  }

  const handleDialog = (open: boolean) => {
    if (!open) setDialog(null)
  }

  return (
    <>
      <DataTable
        className={cn(pending && 'opacity-60 transition-opacity')}
        columns={[
          {
            cell: user => (
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="size-9 rounded-full">
                  {user.avatarUrl && <AvatarImage alt="" src={user.avatarUrl} />}
                  <AvatarFallback className="rounded-full">
                    {userInitials(user) || <LucideIcon name="user" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-1.5 truncate font-medium">
                    {userLabel(user)}
                    {user.id === currentUser.id && (
                      <Badge size="sm" variant="outline">
                        {t('you')}
                      </Badge>
                    )}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            ),
            header: t('columns.user'),
            id: 'user',
          },
          {
            cell: user => (
              <Badge variant="ghost">
                <LucideIcon name={ROLE_ICONS[user.platformRole]} />
                {t(`role_${user.platformRole}`)}
              </Badge>
            ),
            header: t('columns.role'),
            id: 'role',
          },
          {
            cell: user => {
              if (isBanActive(user)) {
                return (
                  <div className="flex flex-col items-start gap-1">
                    <Badge variant="destructive">{t('status_banned')}</Badge>
                    {user.banExpires && (
                      <span className="text-xs text-muted-foreground">
                        {t('bannedUntil', {
                          date: dateTime(new Date(timestampMillis(user.banExpires)), { dateStyle: 'medium' }),
                        })}
                      </span>
                    )}
                    {user.banReason && (
                      <span className="max-w-56 truncate text-xs text-muted-foreground" title={user.banReason}>
                        {t('bannedReason', { reason: user.banReason })}
                      </span>
                    )}
                  </div>
                )
              }
              if (!user.onboardedAt) return <Badge variant="warning">{t('status_pending')}</Badge>
              return <Badge variant="success">{t('status_active')}</Badge>
            },
            header: t('columns.status'),
            id: 'status',
          },
          {
            cell: user => {
              const [first] = user.organizations
              if (!first) return <span className="text-muted-foreground">{t('noOrganizations')}</span>
              if (user.organizations.length === 1) return first.name
              return t('organizationsMore', { count: user.organizations.length - 1, name: first.name })
            },
            className: 'max-w-56 truncate',
            header: t('columns.organizations'),
            id: 'organizations',
          },
          {
            cell: user => dateTime(new Date(timestampMillis(user.createdAt)), { dateStyle: 'medium' }),
            header: t('columns.joined'),
            id: 'joined',
          },
        ]}
        emptyDescription={filtersActive ? t('tryAdjustingFiltersDescription') : t('noUsersDescription')}
        emptyTitle={filtersActive ? t('tryAdjustingFilters') : t('noUsers')}
        filters={
          <UsersFilters
            active={filtersActive}
            onClear={handleClear}
            onFilter={handleFilter}
            onSearch={handleSearch}
            organizations={organizations}
            search={search}
            values={{ banned: params.banned, org: params.org, role: params.role, status: params.status }}
          />
        }
        getRowId={user => user.id}
        label={t('tableLabel')}
        pageSize={page.pageSize}
        pagination={{
          onPageChange: next => setParams({ page: next }),
          page: page.page,
          pageCount: page.pageCount,
          total: page.total,
        }}
        rowActions={user =>
          user.id === currentUser.id ? null : (
            <UserActions
              busy={busyId === user.id}
              onBan={target => setDialog({ kind: 'ban', user: target })}
              onImpersonate={target => setDialog({ kind: 'impersonate', user: target })}
              onRole={handleRole}
              onUnban={target => setDialog({ kind: 'unban', user: target })}
              user={user}
            />
          )
        }
        rows={page.rows}
      />

      <BanDialog
        key={dialog?.kind === 'ban' ? dialog.user.id : 'ban'}
        onDone={() => startNavigation(refresh)}
        onOpenChange={handleDialog}
        user={dialog?.kind === 'ban' ? dialog.user : null}
      />
      <UnbanDialog
        onDone={() => startNavigation(refresh)}
        onOpenChange={handleDialog}
        user={dialog?.kind === 'unban' ? dialog.user : null}
      />
      <ImpersonateDialog
        key={dialog?.kind === 'impersonate' ? dialog.user.id : 'impersonate'}
        onOpenChange={handleDialog}
        user={dialog?.kind === 'impersonate' ? dialog.user : null}
      />
    </>
  )
}
