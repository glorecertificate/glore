'use client'

import { useTranslations } from 'next-intl'

import { type FilterRailProps } from '@/components/ui/filter-rail'
import { SearchInput } from '@/components/ui/search'
import {
  BAN_FILTERS,
  type BanFilter,
  type FacetCounts,
  PLATFORM_ROLES,
  type PlatformRole,
  USER_STATUSES,
  type UserStatus,
} from '@/db/queries/admin-user'

export interface UsersFilterValues {
  banned: BanFilter[]
  org: number[]
  role: PlatformRole[]
  status: UserStatus[]
}

export const useUsersRail = ({
  facets,
  onClear,
  onFilter,
  onSearch,
  organizations,
  search,
  values,
}: {
  facets: FacetCounts
  onClear: () => void
  onFilter: (patch: Partial<UsersFilterValues>) => void
  onSearch: (value: string) => void
  organizations: { id: number; name: string }[]
  search: string
  values: UsersFilterValues
}): FilterRailProps => {
  const t = useTranslations('Admin.users')

  return {
    groups: [
      {
        id: 'organization',
        label: t('filters.organization'),
        onChange: next => onFilter({ org: next.map(Number) }),
        options: organizations.map(organization => ({
          count: facets.organization?.[organization.id] ?? 0,
          label: organization.name,
          value: String(organization.id),
        })),
        searchable: { emptyLabel: t('filters.organizationEmpty'), placeholder: t('filters.organizationSearch') },
        values: values.org.map(String),
      },
      {
        id: 'role',
        label: t('filters.role'),
        onChange: next => onFilter({ role: next as PlatformRole[] }),
        options: PLATFORM_ROLES.map(role => ({
          count: facets.role?.[role] ?? 0,
          label: t(`role_${role}`),
          value: role,
        })),
        values: values.role,
      },
      {
        id: 'status',
        label: t('filters.status'),
        onChange: next => onFilter({ status: next as UserStatus[] }),
        options: USER_STATUSES.map(status => ({
          count: facets.status?.[status] ?? 0,
          label: t(`status_${status}`),
          tone: status === 'active' ? 'success' : 'warning',
          value: status,
        })),
        values: values.status,
      },
      {
        id: 'banned',
        label: t('filters.banned'),
        onChange: next => onFilter({ banned: next as BanFilter[] }),
        options: BAN_FILTERS.map(filter => ({
          count: facets.banned?.[filter] ?? 0,
          label: filter === 'yes' ? t('filters.bannedYes') : t('filters.bannedNo'),
          value: filter,
        })),
        values: values.banned,
      },
    ],
    onReset: onClear,
    search: placement => (
      <SearchInput
        aria-label={t('searchPlaceholder')}
        className="w-full"
        hotkey={placement === 'panel' ? '/' : undefined}
        onValueChange={onSearch}
        placeholder={t('searchPlaceholder')}
        value={search}
      />
    ),
    searchActive: search.length > 0,
  }
}
