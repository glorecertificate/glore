'use client'

import { type Route } from 'next'
import { useState, useTransition } from 'react'

import { useFormatter, useTranslations } from 'next-intl'
import { debounce, useQueryStates } from 'nuqs'

import { useI18n } from '@/components/providers/i18n'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Link } from '@/components/ui/link'
import { SearchInput } from '@/components/ui/search'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AUDIT_CATEGORIES,
  type AdminAuditPage,
  type AdminAuditRow,
  type AuditAction,
  type AuditCategory,
} from '@/db/queries/admin-audit'
import { timestampMillis } from '@/db/queries/organization'
import { cn } from '@/lib/utils'

import { adminAuditParsers } from './audit-params'

const ALL = 'all'
const SEARCH_DEBOUNCE_MS = 300

const EVENT_KEYS = {
  'account.reinstated': 'events.account_reinstated',
  'account.suspended': 'events.account_suspended',
  'certificate.revoked': 'events.certificate_revoked',
  'content.translation_reviewed': 'events.content_translation_reviewed',
  'course.locale_published': 'events.course_locale_published',
  'doc.locale_published': 'events.doc_locale_published',
  'impersonation.started': 'events.impersonation_started',
  'impersonation.stopped': 'events.impersonation_stopped',
  'legal.accepted': 'events.legal_accepted',
  'legal.version_published': 'events.legal_version_published',
  'messages.published': 'events.messages_published',
  'messages.reset': 'events.messages_reset',
  'organization.application_decided': 'events.organization_application_decided',
  'settings.updated': 'events.settings_updated',
  'skill_group.updated': 'events.skill_group_updated',
  'team.invited': 'events.team_invited',
  'team.role_changed': 'events.team_role_changed',
} as const satisfies Record<AuditAction, string>

const CATEGORY_VARIANTS = {
  access: 'info',
  certificates: 'muted',
  content: 'success',
  impersonation: 'warning',
  legal: 'success',
  messages: 'outline',
  moderation: 'destructive',
  organizations: 'brand-soft',
  settings: 'muted',
} as const satisfies Record<AuditCategory, React.ComponentProps<typeof Badge>['variant']>

export const AdminAudit = ({ page }: { page: AdminAuditPage }) => {
  const t = useTranslations('Admin.audit')
  const { dateTime } = useFormatter()
  const { localeItems } = useI18n()
  const [pending, startTransition] = useTransition()
  const [params, setParams] = useQueryStates(adminAuditParsers, {
    clearOnDefault: true,
    shallow: false,
    startTransition,
  })
  const [search, setSearch] = useState(params.q)
  const filtersActive = Boolean(params.q || params.category || params.from || params.to)

  const handleSearch = (value: string) => {
    setSearch(value)
    setParams({ page: 1, q: value }, { limitUrlUpdates: debounce(SEARCH_DEBOUNCE_MS) })
  }

  const handleClear = () => {
    setSearch('')
    setParams({ category: null, from: null, page: 1, q: null, to: null })
  }

  const describe = (row: AdminAuditRow) =>
    t.rich(EVENT_KEYS[row.action], {
      actor: row.actor?.name ?? t('unknownPerson'),
      approved: row.detail.approved ? 'yes' : 'no',
      link: chunks =>
        row.target?.href ? (
          <Link className="font-medium underline-offset-2 hover:underline" href={row.target.href as Route}>
            {chunks}
          </Link>
        ) : (
          <span className="font-medium">{chunks}</span>
        ),
      locale: row.detail.locales
        .map(locale => localeItems.find(({ value }) => value === locale)?.displayLabel ?? locale.toUpperCase())
        .join(', '),
      published: row.detail.published ? 'yes' : 'no',
      role: row.detail.role ?? 'user',
      target: row.target?.label ?? t('unknownTarget'),
    })

  const describeDetail = (row: AdminAuditRow) => {
    const text = row.detail.reason ?? row.detail.comment
    const until =
      row.action === 'account.suspended'
        ? row.detail.expiresAt
          ? t('detail.until', {
              date: dateTime(new Date(timestampMillis(row.detail.expiresAt)), { dateStyle: 'medium' }),
            })
          : t('detail.permanent')
        : null
    if (!(text || until)) return null
    return (
      <div className="flex min-w-0 flex-col gap-0.5">
        {text && (
          <span className="text-sm sm:line-clamp-2" title={text}>
            {text}
          </span>
        )}
        {until && <span className="text-xs text-muted-foreground">{until}</span>}
      </div>
    )
  }

  return (
    <DataTable
      className={cn(pending && 'opacity-60 transition-opacity')}
      columns={[
        {
          cell: row => (
            <span className="whitespace-nowrap">
              {dateTime(new Date(timestampMillis(row.createdAt)), { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          ),
          header: t('columns.date'),
          id: 'date',
        },
        {
          cell: row => (
            <Badge
              className="max-w-full max-sm:text-left max-sm:whitespace-normal"
              variant={CATEGORY_VARIANTS[row.category]}
            >
              {t(`categories.${row.category}`)}
            </Badge>
          ),
          header: t('columns.category'),
          id: 'category',
        },
        {
          cell: row => <span className="text-sm">{describe(row)}</span>,
          className: 'max-w-96 min-w-48 whitespace-normal max-sm:max-w-none',
          header: t('columns.event'),
          id: 'event',
        },
        {
          cell: row =>
            row.organization ? (
              <span className="block truncate" title={row.organization.name}>
                {row.organization.name}
              </span>
            ) : null,
          className: 'max-w-40 max-sm:max-w-none',
          header: t('columns.organization'),
          id: 'organization',
        },
        {
          cell: describeDetail,
          className: 'max-w-64 whitespace-normal max-sm:max-w-none',
          header: t('columns.details'),
          id: 'details',
        },
      ]}
      emptyDescription={filtersActive ? t('noResultsDescription') : t('noEventsDescription')}
      emptyTitle={filtersActive ? t('noResults') : t('noEvents')}
      filters={
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <SearchInput
            aria-label={t('searchPlaceholder')}
            className="h-8 w-full sm:w-72"
            onValueChange={handleSearch}
            placeholder={t('searchPlaceholder')}
            value={search}
          />
          <Select
            onValueChange={value => setParams({ category: value === ALL ? null : (value as AuditCategory), page: 1 })}
            value={params.category ?? ALL}
          >
            <SelectTrigger aria-label={t('filters.category')} className="h-8 w-auto gap-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('filters.allCategories')}</SelectItem>
              {AUDIT_CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>
                  {t(`categories.${category}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            aria-label={t('filters.from')}
            className="w-auto"
            max={params.to ?? undefined}
            onChange={event => setParams({ from: event.target.value || null, page: 1 })}
            size="sm"
            type="date"
            value={params.from ?? ''}
          />
          <Input
            aria-label={t('filters.to')}
            className="w-auto"
            min={params.from ?? undefined}
            onChange={event => setParams({ page: 1, to: event.target.value || null })}
            size="sm"
            type="date"
            value={params.to ?? ''}
          />
          {filtersActive && (
            <Button onClick={handleClear} size="sm" variant="ghost">
              {t('clearFilters')}
            </Button>
          )}
        </div>
      }
      getRowId={row => String(row.id)}
      label={t('tableLabel')}
      pageSize={page.pageSize}
      pagination={{
        onPageChange: next => setParams({ page: next }),
        page: page.page,
        pageCount: page.pageCount,
        total: page.total,
      }}
      rows={page.rows}
    />
  )
}
