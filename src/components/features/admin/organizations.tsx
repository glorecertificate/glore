'use client'

import { useState } from 'react'

import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  Building2Icon,
  CheckIcon,
  PlusIcon,
  SearchXIcon,
  UserPlusIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import {
  approveOrganization,
  createOrganization,
  getOrganizations,
  inviteOrganization,
  rejectOrganization,
} from '@/actions/admin/organizations'
import { useI18n } from '@/components/providers/i18n'
import { Button } from '@/components/ui/button'
import { countryCodeToFlag } from '@/components/ui/country-select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { SearchInput } from '@/components/ui/search'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type AdminOrganization } from '@/db/queries/organization'
import { type MessageKey } from '@/lib/i18n'

import { ApproveDialog, OrgCreateDialog, OrgInviteDialog, OrgRow, RejectDialog } from './organization-items'

type OrgFilter = 'all' | 'pending' | 'active'
type SortField = 'name' | 'country' | 'members'

export const AdminOrganizations = ({ orgs: initialOrgs }: { orgs: AdminOrganization[] }) => {
  const { locale } = useI18n()
  const t = useTranslations('Admin.organizations')
  const tCountries = useTranslations('Intl.Countries')

  const [orgs, setOrgs] = useState(initialOrgs)
  const [filter, setFilter] = useState<OrgFilter>('all')
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('all')
  const [sort, setSort] = useState<SortField | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [approveTarget, setApproveTarget] = useState<AdminOrganization | null>(null)
  const [rejectTarget, setRejectTarget] = useState<AdminOrganization | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const translateCountry = (code: string) => {
    const key = code as MessageKey<'Intl.Countries'>
    return tCountries.has(key) ? tCountries(key) : key.toUpperCase()
  }

  const pendingCount = orgs.filter(o => o.isPending).length

  const countryOptions = (() => {
    const codes = [...new Set(orgs.map(o => o.country).filter((c): c is string => Boolean(c)))]
    return codes
      .map(code => ({ code, label: translateCountry(code) }))
      .toSorted((a, b) => a.label.localeCompare(b.label, locale))
  })()

  const hasFilters = search.trim() !== '' || country !== 'all' || sort !== null

  const displayOrgs = (() => {
    let list = orgs

    if (filter === 'pending') list = list.filter(o => o.isPending)
    if (filter === 'active') list = list.filter(o => o.isApproved)
    if (country !== 'all') list = list.filter(o => o.country === country)

    const needle = search.trim().toLowerCase()
    if (needle) {
      list = list.filter(o => [o.name, o.email, o.city].some(value => value?.toLowerCase().includes(needle)))
    }

    if (!sort) return list

    const factor = sortDir === 'asc' ? 1 : -1
    return list.toSorted((a, b) => {
      if (sort === 'members') return (a.memberCount - b.memberCount) * factor
      if (sort === 'country') {
        const ca = a.country ? translateCountry(a.country) : ''
        const cb = b.country ? translateCountry(b.country) : ''
        return ca.localeCompare(cb, locale) * factor
      }
      return a.name.localeCompare(b.name, locale) * factor
    })
  })()

  const refreshOrgs = async () => {
    const { data } = await getOrganizations({ cache: false })
    if (data) setOrgs(data)
  }

  const resetFilters = () => {
    setSearch('')
    setCountry('all')
    setSort(null)
  }

  const handleSort = (field: SortField) => {
    if (sort === field) {
      setSortDir(dir => (dir === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSort(field)
    setSortDir('asc')
  }

  const handleApprove = async (comment?: string) => {
    if (!approveTarget) return

    const { error } = await approveOrganization(approveTarget.id, comment)

    if (error) {
      console.error(error)
      toast.error(t('approveError'))
      return
    }

    toast.success(t('approveSuccess', { name: approveTarget.name }))
    setApproveTarget(null)
    refreshOrgs()
  }

  const handleReject = async (comment?: string) => {
    if (!rejectTarget) return

    const { error } = await rejectOrganization(rejectTarget.id, comment)

    if (error) {
      console.error(error)
      toast.error(t('rejectError'))
      return
    }

    toast.success(t('rejectSuccess', { name: rejectTarget.name }))
    setRejectTarget(null)
    refreshOrgs()
  }

  const handleInvite = async (data: {
    name: string
    email: string
    city: string
    country: string
    url?: string
    firstName: string
    lastName?: string
    registrantEmail: string
  }) => {
    const { error } = await inviteOrganization(data)

    if (error) {
      console.error(error)
      toast.error(t('inviteError'))
      return
    }

    toast.success(t('inviteSuccess', { name: data.name }))
    refreshOrgs()
  }

  const handleCreate = async (data: { name: string; email: string; city: string; country: string; url?: string }) => {
    const { error } = await createOrganization(data)

    if (error) {
      console.error(error)
      toast.error(t('createError'))
      return
    }

    toast.success(t('createSuccess', { name: data.name }))
    refreshOrgs()
  }

  const sortLabel = sort ? t(`sort_${sort}`) : t('sortBy')

  return (
    <div className="space-y-6 pt-1">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs onValueChange={value => setFilter(value as OrgFilter)} value={filter}>
          <TabsList>
            <TabsTrigger value="all">{t('filter_all')}</TabsTrigger>
            <TabsTrigger count={pendingCount} value="pending">
              {t('filter_pending')}
            </TabsTrigger>
            <TabsTrigger value="active">{t('filter_active')}</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Button className="gap-2" onClick={() => setCreateOpen(true)} size="sm" variant="brand">
            <PlusIcon className="size-4" />
            {t('createOrg')}
          </Button>
          <Button className="gap-2" onClick={() => setInviteOpen(true)} size="sm" variant="outline">
            <UserPlusIcon className="size-4" />
            {t('inviteOrg')}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/20 px-4 py-3">
          <SearchInput
            className="h-8 w-full sm:w-64"
            hotkey="/"
            onValueChange={setSearch}
            placeholder={t('searchPlaceholder')}
            value={search}
          />

          {countryOptions.length > 0 && (
            <Select onValueChange={setCountry} value={country}>
              <SelectTrigger className="h-8 w-auto gap-1.5 border-dashed text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allCountries')}</SelectItem>
                {countryOptions.map(({ code, label }) => (
                  <SelectItem key={code} value={code}>
                    <span className="mr-1">{countryCodeToFlag(code)}</span>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-8 gap-1.5 border-dashed" size="sm" variant="outline">
                <ArrowUpDownIcon className="size-3.5" />
                {sortLabel}
                {sort &&
                  (sortDir === 'asc' ? <ArrowUpIcon className="size-3" /> : <ArrowDownIcon className="size-3" />)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {(['name', 'country', 'members'] as SortField[]).map(field => (
                <DropdownMenuItem key={field} onClick={() => handleSort(field)}>
                  {t(`sort_${field}`)}
                  {sort === field && <CheckIcon className="ml-auto size-3.5" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasFilters && (
            <Button className="h-8" onClick={resetFilters} size="sm" variant="ghost">
              {t('clearFilters')}
            </Button>
          )}

          <span className="ml-auto hidden text-xs text-muted-foreground sm:block">
            {t('resultsCount', { count: displayOrgs.length })}
          </span>
        </div>

        {orgs.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Building2Icon />
              </EmptyMedia>
              <EmptyTitle>{t('emptyTitle')}</EmptyTitle>
              <EmptyDescription>{t('emptyMessage')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : displayOrgs.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchXIcon />
              </EmptyMedia>
              <EmptyTitle>{t('emptyFilteredTitle')}</EmptyTitle>
              <EmptyDescription>{t('emptyFilteredMessage')}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={resetFilters} size="sm" variant="outline">
                {t('clearFilters')}
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="divide-y">
            {displayOrgs.map(org => (
              <OrgRow key={org.id} onApprove={setApproveTarget} onReject={setRejectTarget} org={org} query={search} />
            ))}
          </div>
        )}
      </div>

      <ApproveDialog
        onConfirm={handleApprove}
        onOpenChange={open => !open && setApproveTarget(null)}
        open={!!approveTarget}
        org={approveTarget}
      />
      <RejectDialog
        onConfirm={handleReject}
        onOpenChange={open => !open && setRejectTarget(null)}
        open={!!rejectTarget}
        org={rejectTarget}
      />
      <OrgInviteDialog onInvite={handleInvite} onOpenChange={setInviteOpen} open={inviteOpen} />
      <OrgCreateDialog onCreate={handleCreate} onOpenChange={setCreateOpen} open={createOpen} />
    </div>
  )
}
