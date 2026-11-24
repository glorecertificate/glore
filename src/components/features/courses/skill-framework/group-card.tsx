'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { CourseRowMenu } from '@/components/features/courses/skill-framework/assign-select'
import { SkillGroupControls } from '@/components/features/courses/skill-framework/group-controls'
import { type SkillGroupDraft } from '@/components/features/courses/skill-framework/group-dialog'
import { LocaleFlags } from '@/components/features/courses/skill-framework/locale-flags'
import { LucideIcon } from '@/components/icons/lucide'
import { Card } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Link } from '@/components/ui/link'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'

export interface SkillRow {
  id: number
  languages: string[]
  slug: string
  status: 'archived' | 'draft' | 'published'
  title: string
}

interface SkillGroupCardProps {
  attention?: boolean
  canMoveDown?: boolean
  canMoveUp?: boolean
  defaultOpen: boolean
  description?: string | null
  draft?: SkillGroupDraft
  groupId: number | null
  groups: { id: number; name: string }[]
  id: string
  name: string
  rows: SkillRow[]
}

const OPEN_STATE = new Map<string, boolean>()

const STATUS_LABELS = { archived: 'archived', draft: 'draft', published: 'published' } as const

export const SkillGroupCard = ({
  attention = false,
  canMoveDown = false,
  canMoveUp = false,
  defaultOpen,
  description,
  draft,
  groupId,
  groups,
  id,
  name,
  rows,
}: SkillGroupCardProps) => {
  const t = useTranslations('Learning.framework')
  const tList = useTranslations('CourseList')
  const [open, setOpen] = useState(() => OPEN_STATE.get(id) ?? defaultOpen)

  const onOpenChange = (value: boolean) => {
    setOpen(value)
    OPEN_STATE.set(id, value)
  }

  const published = rows.filter(row => row.status === 'published').length
  const drafts = rows.filter(row => row.status === 'draft').length

  return (
    <Card className={cn('gap-0 p-0', attention && 'border-warning-border')}>
      <Collapsible onOpenChange={onOpenChange} open={open}>
        <header className="flex items-center gap-2 p-3 sm:px-4">
          <CollapsibleTrigger className="flex min-h-11 min-w-0 grow cursor-pointer items-center gap-3 rounded-lg text-left outline-none focus-visible:focus-ring">
            <LucideIcon
              aria-hidden
              className={cn(
                'size-4 shrink-0 text-muted-foreground transition-transform duration-150',
                open && 'rotate-90'
              )}
              name="chevron-right"
            />
            <span className="flex min-w-0 flex-col">
              <span className="truncate type-heading">{name}</span>
              <span className="truncate text-sm text-muted-foreground">
                {description ? `${description} · ` : ''}
                {t('skillSummary', { count: rows.length, drafts, published })}
              </span>
            </span>
          </CollapsibleTrigger>
          {draft && <SkillGroupControls canMoveDown={canMoveDown} canMoveUp={canMoveUp} group={draft} />}
        </header>
        <CollapsibleContent>
          {rows.length === 0 ? (
            <p className="border-t p-4 text-sm text-muted-foreground">
              {groupId === null ? t('ungroupedEmpty') : t('empty')}
            </p>
          ) : (
            <ul className="divide-y border-t">
              {rows.map(row => (
                <li
                  className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-1 py-2 pr-2 pl-4 sm:pl-11"
                  key={row.id}
                >
                  <Link
                    className="min-w-0 basis-full font-medium wrap-break-word sm:flex-1 sm:basis-0 sm:truncate"
                    href={`/courses/${row.slug}`}
                  >
                    {row.title}
                  </Link>
                  <LocaleFlags languages={row.languages} />
                  <StatusBadge className="ml-1" tone={row.status === 'published' ? 'success' : 'neutral'}>
                    {tList(STATUS_LABELS[row.status])}
                  </StatusBadge>
                  <CourseRowMenu courseId={row.id} courseTitle={row.title} groupId={groupId} groups={groups} />
                </li>
              ))}
            </ul>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
