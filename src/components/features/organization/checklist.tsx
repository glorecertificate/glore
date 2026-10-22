'use client'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { type OrganizationChecklist as Checklist } from '@/db/queries/organization-insights'
import { cn } from '@/lib/utils'

import { type OrganizationTab } from './tabs'

const STEPS = [
  { key: 'profile', tab: 'settings' },
  { key: 'tutor', tab: 'invitations' },
  { key: 'volunteers', tab: 'invitations' },
  { key: 'certificate', tab: 'certificates' },
] as const satisfies { key: Exclude<keyof Checklist, 'completed' | 'total'>; tab: OrganizationTab }[]

export const OrganizationChecklist = ({
  canEditSettings,
  checklist,
  onNavigate,
}: {
  canEditSettings: boolean
  checklist: Checklist
  onNavigate: (tab: OrganizationTab) => void
}) => {
  const t = useTranslations('Organization')

  if (checklist.completed === checklist.total) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('checklistTitle')}</CardTitle>
        <CardDescription>
          {t('checklistProgress', { completed: checklist.completed, total: checklist.total })}
        </CardDescription>
        <Progress
          aria-label={t('checklistTitle')}
          color="brand"
          value={(checklist.completed / checklist.total) * 100}
        />
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {STEPS.map(({ key, tab }) => {
            const done = checklist[key]
            const actionable = !done && (key !== 'profile' || canEditSettings)
            return (
              <li className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0" key={key}>
                <LucideIcon
                  className={cn('size-5 shrink-0', done ? 'text-success' : 'text-muted-foreground')}
                  name={done ? 'circle-check' : 'circle'}
                />
                <div className="min-w-0 flex-1">
                  <p className={cn('text-sm font-medium', done && 'text-muted-foreground line-through')}>
                    {t(`checklist_${key}`)}
                  </p>
                  <p className="text-sm text-muted-foreground">{t(`checklist_${key}_description`)}</p>
                </div>
                {actionable && (
                  <Button onClick={() => onNavigate(tab)} size="sm" type="button" variant="outline">
                    {t(`checklist_${key}_action`)}
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
