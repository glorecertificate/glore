'use client'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/search'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  BAN_FILTERS,
  type BanFilter,
  PLATFORM_ROLES,
  type PlatformRole,
  USER_STATUSES,
  type UserStatus,
} from '@/db/queries/admin-user'

const ALL = 'all'

export interface UsersFilterValues {
  banned: BanFilter | null
  org: number | null
  role: PlatformRole | null
  status: UserStatus | null
}

export const UsersFilters = ({
  active,
  onClear,
  onFilter,
  onSearch,
  organizations,
  search,
  values,
}: {
  active: boolean
  onClear: () => void
  onFilter: (patch: Partial<UsersFilterValues>) => void
  onSearch: (value: string) => void
  organizations: { id: number; name: string }[]
  search: string
  values: UsersFilterValues
}) => {
  const t = useTranslations('Admin.users')

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <SearchInput
        aria-label={t('searchPlaceholder')}
        className="h-8 w-full sm:w-72"
        onValueChange={onSearch}
        placeholder={t('searchPlaceholder')}
        value={search}
      />
      <Select
        onValueChange={value => onFilter({ role: value === ALL ? null : (value as PlatformRole) })}
        value={values.role ?? ALL}
      >
        <SelectTrigger aria-label={t('filters.role')} className="h-8 w-auto gap-1.5">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t('filters.allRoles')}</SelectItem>
          {PLATFORM_ROLES.map(role => (
            <SelectItem key={role} value={role}>
              {t(`role_${role}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        onValueChange={value => onFilter({ status: value === ALL ? null : (value as UserStatus) })}
        value={values.status ?? ALL}
      >
        <SelectTrigger aria-label={t('filters.status')} className="h-8 w-auto gap-1.5">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t('filters.allStatuses')}</SelectItem>
          {USER_STATUSES.map(status => (
            <SelectItem key={status} value={status}>
              {t(`status_${status}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        onValueChange={value => onFilter({ banned: value === ALL ? null : (value as BanFilter) })}
        value={values.banned ?? ALL}
      >
        <SelectTrigger aria-label={t('filters.banned')} className="h-8 w-auto gap-1.5">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t('filters.allBans')}</SelectItem>
          {BAN_FILTERS.map(filter => (
            <SelectItem key={filter} value={filter}>
              {filter === 'yes' ? t('filters.bannedYes') : t('filters.bannedNo')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        onValueChange={value => onFilter({ org: value === ALL ? null : Number(value) })}
        value={values.org === null ? ALL : String(values.org)}
      >
        <SelectTrigger aria-label={t('filters.organization')} className="h-8 w-auto max-w-56 gap-1.5">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t('filters.allOrganizations')}</SelectItem>
          {organizations.map(organization => (
            <SelectItem key={organization.id} value={String(organization.id)}>
              {organization.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {active && (
        <Button onClick={onClear} size="sm" variant="ghost">
          {t('clearFilters')}
        </Button>
      )}
    </div>
  )
}
