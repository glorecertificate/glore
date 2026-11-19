import { useLocale, useTranslations } from 'next-intl'

import { SkillGroupCard, type SkillRow } from '@/components/features/courses/skill-framework/group-card'
import { pickCourseTitle, pickLocale } from '@/db/queries/learning'
import { type IntlRecord } from '@/lib/i18n'
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

export const SkillFramework = ({
  className,
  groups,
  ungrouped,
  ...props
}: React.ComponentProps<'div'> & { groups: FrameworkGroup[]; ungrouped: FrameworkCourse[] }) => {
  const t = useTranslations('Learning.framework')
  const locale = useLocale() as keyof IntlRecord
  const options = groups.map(group => ({ id: group.id, name: pickLocale(group.name, locale) ?? group.slug }))

  const toRows = (courses: FrameworkCourse[]): SkillRow[] =>
    courses.map(course => {
      const languages = course.languages ?? []
      return {
        id: course.id,
        languages,
        slug: course.slug,
        status: course.archivedAt ? 'archived' : languages.length === 0 ? 'draft' : 'published',
        title: pickCourseTitle(course.title ?? undefined, locale, course.slug),
      }
    })

  const unassigned = (
    <SkillGroupCard
      attention={ungrouped.length > 0}
      defaultOpen={ungrouped.length > 0}
      description={ungrouped.length > 0 ? t('ungroupedHint') : null}
      groupId={null}
      groups={options}
      id="ungrouped"
      key="ungrouped"
      name={t('ungroupedTitle')}
      rows={toRows(ungrouped)}
    />
  )

  return (
    <div className={cn('mx-auto flex w-full max-w-240 flex-col gap-4', className)} {...props}>
      {ungrouped.length > 0 && unassigned}
      {groups.map((group, index) => (
        <SkillGroupCard
          canMoveDown={index < groups.length - 1}
          canMoveUp={index > 0}
          defaultOpen={index === 0 && ungrouped.length === 0}
          description={pickLocale(group.description ?? undefined, locale)}
          draft={{
            description: group.description,
            icon: group.icon,
            id: group.id,
            name: group.name,
            slug: group.slug,
          }}
          groupId={group.id}
          groups={options}
          id={String(group.id)}
          key={group.id}
          name={pickLocale(group.name, locale) ?? group.slug}
          rows={toRows(group.courses)}
        />
      ))}
      {ungrouped.length === 0 && unassigned}
    </div>
  )
}
