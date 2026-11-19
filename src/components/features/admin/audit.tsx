'use client'

import { type Route } from 'next'
import { useState, useTransition } from 'react'

import { useFormatter, useTranslations } from 'next-intl'
import { debounce, useQueryStates } from 'nuqs'

import { type IconName } from '@/components/icons/registry'
import { useI18n } from '@/components/providers/i18n'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Link } from '@/components/ui/link'
import { SearchInput } from '@/components/ui/search'
import { StatusBadge, type StatusMeta } from '@/components/ui/status-badge'
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

const CATEGORY_META = {
  access: { icon: 'shield-user', tone: 'info' },
  certificates: { icon: 'badge-check', tone: 'neutral' },
  content: { icon: 'pencil', tone: 'success' },
  impersonation: { icon: 'eye', tone: 'warning' },
  legal: { icon: 'file-text', tone: 'success' },
  messages: { icon: 'languages', tone: 'neutral' },
  moderation: { icon: 'ban', tone: 'danger' },
  organizations: { icon: 'building-2', tone: 'info' },
  settings: { icon: 'settings', tone: 'neutral' },
} as const satisfies Record<AuditCategory, { icon: IconName; tone: StatusMeta['tone'] }>

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
      aria-busy={pending}
      className={cn(pending && 'opacity-60 transition-opacity')}
      columns={[
        {
          cell: row => (
            <div className="flex flex-col">
              <span className="whitespace-nowrap">
                {dateTime(new Date(timestampMillis(row.createdAt)), { dateStyle: 'medium' })}
              </span>
              <span className="text-xs whitespace-nowrap text-muted-foreground">
                {dateTime(new Date(timestampMillis(row.createdAt)), { timeStyle: 'short' })}
              </span>
            </div>
          ),
          header: t('columns.date'),
          id: 'date',
        },
        {
          cell: row => (
            <StatusBadge
              className="max-w-full max-sm:text-left max-sm:whitespace-normal"
              tone={CATEGORY_META[row.category].tone}
            >
              {t(`categories.${row.category}`)}
            </StatusBadge>
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
      rail={{
        extra: (
          <fieldset className="flex min-w-0 flex-col gap-2">
            <legend className="mb-1 type-label text-fg-title">{t('filters.dates')}</legend>
            <Input
              aria-label={t('filters.from')}
              max={params.to ?? undefined}
              onChange={event => setParams({ from: event.target.value || null, page: 1 })}
              size="sm"
              type="date"
              value={params.from ?? ''}
            />
            <Input
              aria-label={t('filters.to')}
              min={params.from ?? undefined}
              onChange={event => setParams({ page: 1, to: event.target.value || null })}
              size="sm"
              type="date"
              value={params.to ?? ''}
            />
          </fieldset>
        ),
        groups: [
          {
            id: 'category',
            label: t('filters.category'),
            onChange: ([value]) => setParams({ category: (value as AuditCategory | undefined) ?? null, page: 1 }),
            options: AUDIT_CATEGORIES.map(category => ({
              count: page.facets.category?.[category] ?? 0,
              label: t(`categories.${category}`),
              tone: CATEGORY_META[category].tone,
              value: category,
            })),
            selection: 'single',
            values: params.category ? [params.category] : [],
          },
        ],
        onReset: handleClear,
        search: placement => (
          <SearchInput
            aria-label={t('searchPlaceholder')}
            className="w-full"
            hotkey={placement === 'panel' ? '/' : undefined}
            onValueChange={handleSearch}
            placeholder={t('searchPlaceholder')}
            size="sm"
            value={search}
          />
        ),
        searchActive: search.length > 0 || Boolean(params.from || params.to),
      }}
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
