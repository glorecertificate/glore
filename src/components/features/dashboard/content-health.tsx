'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { type ContentHealth as ContentHealthData, type HealthCourse } from '@/actions/dashboard/core'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { Progress } from '@/components/ui/progress'
import { LOCALES } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const VISIBLE_ROWS = 6

const GRID = 'md:grid md:grid-cols-[minmax(0,1fr)_5.25rem_5.25rem_2.25rem_2.25rem_2.25rem] md:items-center md:gap-2'

const MissingDot = () => <span aria-hidden className="size-2 shrink-0 rounded-full bg-status-changes" />

const Cell = ({ applies = true, item, missing }: { applies?: boolean; item: string; missing: boolean }) => {
  const t = useTranslations('Dashboard.editor')
  if (!applies) {
    return (
      <span className="hidden justify-center md:flex">
        <LucideIcon aria-hidden className="size-3.5 text-muted-foreground/50" name="minus" />
        <span className="sr-only">{t('healthNotNeeded', { item })}</span>
      </span>
    )
  }

  return (
    <span className="hidden justify-center md:flex">
      {missing ? <MissingDot /> : <LucideIcon aria-hidden className="size-3.5 text-muted-foreground" name="check" />}
      <span className="sr-only">{t(missing ? 'healthMissing' : 'healthDone', { item })}</span>
    </span>
  )
}

const ColumnTotal = ({ count, item }: { count: number; item: string }) => {
  const t = useTranslations('Dashboard.editor')
  return (
    <span className="text-center">
      <span aria-hidden>{count}</span>
      <span className="sr-only">{t('healthColumnTotal', { count, item })}</span>
    </span>
  )
}

const CourseRow = ({ course }: { course: HealthCourse }) => {
  const t = useTranslations('Dashboard.editor')
  const items = [
    ...(course.missingAssessment ? [t('healthAssessment')] : []),
    ...(course.missingGroup ? [t('healthGroup')] : []),
    ...course.missing.map(locale => locale.toUpperCase()),
  ]
  const details = [t(`healthStatus.${course.status}`), ...(course.empty ? [t('issue.empty')] : [])].join(' · ')

  return (
    <li
      className={cn(
        GRID,
        'relative -mx-2 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-hover has-[a:focus-visible]:bg-surface-hover'
      )}
    >
      <div className="min-w-0">
        <Link
          className="block truncate text-sm font-medium outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:focus-ring"
          href={`/courses/${course.slug}`}
        >
          {course.title}
        </Link>
        <p className="flex gap-1 text-xs text-muted-foreground">
          <span className="truncate">{course.slug}</span>
          <span className="shrink-0">{`· ${details}`}</span>
        </p>
      </div>
      <Cell applies={course.skill} item={t('healthAssessment')} missing={course.missingAssessment} />
      <Cell applies={course.skill} item={t('healthGroup')} missing={course.missingGroup} />
      {LOCALES.map(locale => (
        <Cell item={locale.toUpperCase()} key={locale} missing={course.missing.includes(locale)} />
      ))}
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs md:hidden">
        {items.map(item => (
          <li className="flex items-center gap-1.5" key={item}>
            <MissingDot />
            <span className="sr-only">{t('healthMissing', { item })}</span>
            <span aria-hidden>{item}</span>
          </li>
        ))}
      </ul>
    </li>
  )
}

export const ContentHealth = ({ health }: { health: ContentHealthData }) => {
  const t = useTranslations('Dashboard.editor')
  const [expanded, setExpanded] = useState(false)
  const { columns, complete, courses, total } = health
  const collapsible = courses.length > VISIBLE_ROWS
  const rows = expanded ? courses : courses.slice(0, VISIBLE_ROWS)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('healthTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="type-stat text-foreground tabular-nums">{complete}</span>
            <span className="text-sm text-muted-foreground">{t('healthCompleteOf', { total })}</span>
            {courses.length > 0 && (
              <span className="ml-auto flex items-center gap-2 text-sm">
                <MissingDot />
                <span className="tabular-nums">{t('healthNeedWork', { count: courses.length })}</span>
              </span>
            )}
          </div>
          <Progress
            aria-label={t('healthCompleteLabel', { complete, total })}
            color="success"
            value={total > 0 ? (complete / total) * 100 : 0}
          />
        </div>

        {courses.length === 0 && <p className="text-sm text-muted-foreground">{t('healthClear')}</p>}

        {courses.length > 0 && (
          <div className="flex flex-col">
            <div className={cn(GRID, 'hidden border-b pb-2 type-overline text-muted-foreground')}>
              <span>{t('healthCourse')}</span>
              <span className="truncate text-center">{t('healthAssessment')}</span>
              <span className="truncate text-center">{t('healthGroup')}</span>
              {LOCALES.map(locale => (
                <span className="text-center" key={locale}>
                  {locale.toUpperCase()}
                </span>
              ))}
            </div>
            <ul className="flex flex-col divide-y md:divide-y-0">
              {rows.map(course => (
                <CourseRow course={course} key={course.id} />
              ))}
            </ul>
            <div className={cn(GRID, 'hidden border-t pt-2.5 text-sm font-medium tabular-nums')}>
              <span className="text-xs text-muted-foreground">{t('healthAll', { count: courses.length })}</span>
              <ColumnTotal count={columns.assessment} item={t('healthAssessment')} />
              <ColumnTotal count={columns.group} item={t('healthGroup')} />
              {LOCALES.map(locale => (
                <ColumnTotal count={columns[locale]} item={locale.toUpperCase()} key={locale} />
              ))}
            </div>
            {collapsible && (
              <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
                <Button
                  aria-expanded={expanded}
                  className="-ml-2.5"
                  onClick={() => setExpanded(current => !current)}
                  size="xs"
                  variant="link"
                >
                  {expanded ? t('healthShowFewer') : t('healthShowAll', { count: courses.length })}
                  <LucideIcon aria-hidden name={expanded ? 'chevron-up' : 'chevron-down'} />
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {t('healthShowing', { shown: rows.length, total: courses.length })}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
