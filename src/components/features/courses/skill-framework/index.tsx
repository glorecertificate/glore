import { useLocale, useTranslations } from 'next-intl'

import { AssignSkillGroup } from '@/components/features/courses/skill-framework/assign-select'
import { SkillGroupControls } from '@/components/features/courses/skill-framework/group-controls'
import { SkillGroupDialog } from '@/components/features/courses/skill-framework/group-dialog'
import { skillGroupTone, skillGroupToneVariants } from '@/components/features/courses/skill-group'
import { LucideIcon } from '@/components/icons/lucide'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { pickCourseTitle, pickLocale } from '@/db/queries/learning'
import { type IntlRecord } from '@/lib/i18n'
import { type IconName } from '@/lib/types'
import { cn } from '@/lib/utils'

interface FrameworkCourse {
  archivedAt: string | null
  id: number
  languages: string[] | null
  slug: string
  title: IntlRecord | null
}

export interface FrameworkGroup {
  courses: FrameworkCourse[]
  description: IntlRecord | null
  icon: string | null
  id: number
  name: IntlRecord
  slug: string
}

const CourseRow = ({
  course,
  groupId,
  groups,
}: {
  course: FrameworkCourse
  groupId: number | null
  groups: { id: number; name: string }[]
}) => {
  const t = useTranslations('CourseList')
  const tFramework = useTranslations('Learning.framework')
  const locale = useLocale() as keyof IntlRecord
  const title = pickCourseTitle(course.title ?? undefined, locale, course.slug)
  const languages = course.languages ?? []
  const status = course.archivedAt ? 'archived' : languages.length === 0 ? 'draft' : 'published'

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2">
      <Link
        className="min-w-0 basis-full font-medium wrap-break-word hover:underline sm:flex-1 sm:basis-0 sm:truncate"
        href={`/courses/${course.slug}`}
      >
        {title}
      </Link>
      <Badge variant={status === 'published' ? 'success' : 'muted'}>{t(status)}</Badge>
      <span className="text-xs text-muted-foreground uppercase">{languages.join(' ')}</span>
      <AssignSkillGroup courseId={course.id} courseTitle={title} groupId={groupId} groups={groups} />
      <span className="sr-only">{tFramework('openCourse')}</span>
    </li>
  )
}

export const SkillFramework = ({
  className,
  groups,
  ungrouped,
  ...props
}: React.ComponentProps<'div'> & { groups: FrameworkGroup[]; ungrouped: FrameworkCourse[] }) => {
  const t = useTranslations('Learning.framework')
  const locale = useLocale() as keyof IntlRecord
  const options = groups.map(group => ({ id: group.id, name: pickLocale(group.name, locale) ?? group.slug }))

  return (
    <div className={cn('mx-auto flex w-full max-w-4xl flex-col gap-6 pt-2 pb-10', className)} {...props}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <SkillGroupDialog>
          <Button variant="brand">
            <LucideIcon className="size-4" name="plus" />
            {t('addGroup')}
          </Button>
        </SkillGroupDialog>
      </div>
      {groups.map((group, index) => {
        const name = pickLocale(group.name, locale) ?? group.slug
        const description = pickLocale(group.description ?? undefined, locale)
        return (
          <section className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-2xs" key={group.id}>
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full',
                    skillGroupToneVariants({ surface: 'soft', tone: skillGroupTone(group.slug) })
                  )}
                >
                  <LucideIcon className="size-5" name={(group.icon ?? 'layers') as IconName} />
                </span>
                <div className="flex min-w-0 flex-col">
                  <h2 className="truncate text-lg font-semibold">{name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t('skillCount', { count: group.courses.length })}
                    {description ? ` · ${description}` : ''}
                  </p>
                </div>
              </div>
              <SkillGroupControls
                canMoveDown={index < groups.length - 1}
                canMoveUp={index > 0}
                group={{
                  description: group.description,
                  icon: group.icon,
                  id: group.id,
                  name: group.name,
                  slug: group.slug,
                }}
              />
            </header>
            {group.courses.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('empty')}</p>
            ) : (
              <ul className="divide-y">
                {group.courses.map(course => (
                  <CourseRow course={course} groupId={group.id} groups={options} key={course.id} />
                ))}
              </ul>
            )}
          </section>
        )
      })}
      {ungrouped.length > 0 && (
        <section className="flex flex-col gap-3 rounded-2xl border border-dashed p-5">
          <header className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">{t('ungroupedTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('ungroupedHint')}</p>
          </header>
          <ul className="divide-y">
            {ungrouped.map(course => (
              <CourseRow course={course} groupId={null} groups={options} key={course.id} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
