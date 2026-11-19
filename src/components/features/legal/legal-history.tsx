'use client'

import { useState } from 'react'

import { useFormatter, useTranslations } from 'next-intl'

import { LegalVersionDialog } from '@/components/features/legal/legal-version-dialog'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { type LegalDocument, type LegalVersionRow } from '@/db/queries/legal'
import { LOCALES } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const TONES = { draft: 'draft', published: 'success', superseded: 'neutral' } as const satisfies Record<
  LegalVersionRow['status'],
  StatusTone
>

const PUBLIC_PAGES = { 'quality-charter': '/quality-charter', privacy: '/privacy', terms: '/terms' } as const

const LanguageDots = ({ version }: { version: LegalVersionRow }) => (
  <ul className="flex items-center gap-2.5">
    {LOCALES.map(locale => {
      const filled = version.translations.some(item => item.locale === locale && item.body.trim().length > 0)
      return (
        <li className="inline-flex items-center gap-1 type-caption text-fg-2" key={locale}>
          <span
            aria-hidden
            className={cn('size-2 rounded-full border', filled ? 'border-success bg-success' : 'border-fg-3')}
          />
          <span className="uppercase">{locale}</span>
        </li>
      )
    })}
  </ul>
)

export const LegalHistory = ({
  action,
  slug,
  versions,
}: {
  action?: React.ReactNode
  slug: LegalDocument
  versions: LegalVersionRow[]
}) => {
  const t = useTranslations('LegalAdmin')
  const { dateTime } = useFormatter()
  const [selected, setSelected] = useState<LegalVersionRow | null>(null)
  const date = (value: string | null) =>
    value ? dateTime(new Date(value), { dateStyle: 'medium', timeZone: 'UTC' }) : t('notSet')
  const changed = (version: LegalVersionRow) =>
    version.publishedBy && version.publishedAt
      ? `${version.publishedBy}, ${date(version.publishedAt)}`
      : date(version.publishedAt)
  const sorted = versions.toSorted((a, b) => b.version - a.version)

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <CardTitle>{t('versions')}</CardTitle>
          <CardDescription>{versions.length === 0 ? t('historyEmpty') : t('versionsDescription')}</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-action-text hover:underline sm:min-h-9"
            href={PUBLIC_PAGES[slug]}
            target="_blank"
          >
            {t('viewPublic')}
            <LucideIcon className="size-3.5" name="arrow-up-right" />
          </Link>
          {action}
        </div>
      </CardHeader>
      {versions.length > 0 && (
        <CardContent>
          <div className="hidden md:block" data-testid="legal-history">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('columnVersion')}</TableHead>
                  <TableHead>{t('columnStatus')}</TableHead>
                  <TableHead>{t('columnEffective')}</TableHead>
                  <TableHead>{t('columnLanguages')}</TableHead>
                  <TableHead>{t('columnChanged')}</TableHead>
                  <TableHead className="w-0">
                    <span className="sr-only">{t('columnActions')}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map(version => (
                  <TableRow key={version.id}>
                    <TableCell className="font-medium tabular-nums">
                      {t('version', { version: version.version })}
                      {version.material && <span className="ml-2 type-caption text-fg-2">{t('material')}</span>}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={TONES[version.status]}>{t(`status_${version.status}`)}</StatusBadge>
                    </TableCell>
                    <TableCell>{date(version.effectiveAt)}</TableCell>
                    <TableCell>
                      <LanguageDots version={version} />
                    </TableCell>
                    <TableCell className="text-fg-2">{changed(version)}</TableCell>
                    <TableCell className="text-right">
                      <Button onClick={() => setSelected(version)} size="sm" type="button" variant="ghost">
                        {t('view')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul className="divide-y md:hidden" data-testid="legal-history-list">
            {sorted.map(version => (
              <li className="flex items-center gap-3 py-3" key={version.id}>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-medium tabular-nums">{t('version', { version: version.version })}</span>
                    <StatusBadge tone={TONES[version.status]}>{t(`status_${version.status}`)}</StatusBadge>
                  </div>
                  <p className="type-caption text-fg-2">{t('effective', { date: date(version.effectiveAt) })}</p>
                </div>
                <Button onClick={() => setSelected(version)} size="sm" type="button" variant="outline">
                  {t('view')}
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
      <LegalVersionDialog onOpenChange={open => !open && setSelected(null)} version={selected} />
    </Card>
  )
}
