'use client'

import { useTranslations } from 'next-intl'

import { useCourses } from '@/components/features/courses/context'
import { type CourseListTab } from '@/components/features/courses/course-list/params'
import {
  matchesFacets,
  useCourseList,
  useCourseListFacets,
  useCourseListFilters,
  useCourseListLanguages,
  useCourseListSearch,
  useCourseListSkillGroups,
  useCourseListTab,
  useCourseListTabs,
  useCourseListTypes,
} from '@/components/features/courses/course-list/use-params'
import { listedCourseTypes } from '@/components/features/courses/visibility'
import { useI18n } from '@/components/providers/i18n'
import { useSession } from '@/components/providers/session'
import { type FilterRailProps } from '@/components/ui/filter-rail'
import { SearchInput } from '@/components/ui/search'
import { type StatusBadge } from '@/components/ui/status-badge'
import { COURSE_TYPES } from '@/db/queries/course'
import { LOCALES } from '@/lib/i18n'
import { SHORTCUTS } from '@/lib/shortcuts'
import { camelize } from '@/lib/utils'

type StatusTone = React.ComponentProps<typeof StatusBadge>['tone']

const TAB_TONES: Partial<Record<CourseListTab, StatusTone>> = {
  completed: 'success',
  draft: 'neutral',
  inProgress: 'info',
  notStarted: 'neutral',
  partial: 'warning',
  published: 'success',
}

const single = <T,>(values: T[], total: number) => (values.length === 1 && total > 1 ? values[0]! : null)

export const useCourseListRail = (): FilterRailProps => {
  const t = useTranslations('CourseList')
  const tCommon = useTranslations('CourseCommon')
  const { localeItems, localize } = useI18n()
  const { user } = useSession()
  const { skillGroups } = useCourses()
  const { tab, setTab } = useCourseListTab()
  const { tabs } = useCourseListTabs()
  const { courseList } = useCourseList()
  const facets = useCourseListFacets()
  const { activeTypes, setActiveTypes } = useCourseListTypes()
  const { activeLanguages, setActiveLanguages } = useCourseListLanguages()
  const { activeSkillGroups, setActiveSkillGroups } = useCourseListSkillGroups()
  const { resetFilters } = useCourseListFilters()
  const { searching } = useCourseListSearch()

  const current = courseList[camelize(tab)]
  const countWith = (patch: Partial<typeof facets>) =>
    current.filter(course => matchesFacets(course, { ...facets, ...patch })).length

  const listedTypes = listedCourseTypes(user)
  const statusTabs = tabs.filter(item => item !== 'all')

  const groups: FilterRailProps['groups'] = []

  if (statusTabs.length > 1) {
    groups.push({
      id: 'status',
      label: t('status'),
      onChange: value => setTab((value as CourseListTab | null) ?? 'all'),
      options: statusTabs.map(item => ({
        count: courseList[camelize(item)].filter(course => matchesFacets(course, facets)).length,
        label: t(item),
        tone: TAB_TONES[item],
        value: item,
      })),
      value: tab === 'all' ? null : tab,
    })
  }

  groups.push({
    id: 'type',
    label: tCommon('courseType'),
    onChange: value => setActiveTypes(value ? [value as (typeof COURSE_TYPES)[number]] : null),
    options: listedTypes.map(type => ({
      count: countWith({ types: [type] }),
      label: tCommon(`courseType-${type}`),
      value: type,
    })),
    value: single(activeTypes, listedTypes.length),
  })

  if (skillGroups.length > 0 && listedTypes.includes('skill')) {
    groups.push({
      id: 'group',
      label: tCommon('skillGroup'),
      onChange: value => setActiveSkillGroups(value ? [value] : null),
      options: skillGroups.map(group => ({
        count: countWith({ groups: [group.value] }),
        label: localize(group.name) ?? group.label,
        value: group.value,
      })),
      value: single(activeSkillGroups, skillGroups.length),
    })
  }

  groups.push({
    id: 'language',
    label: t('language'),
    onChange: value => setActiveLanguages(value ? [value as (typeof LOCALES)[number]] : null),
    options: localeItems.map(item => ({
      count: countWith({ languages: [item.value] }),
      label: item.label,
      value: item.value,
    })),
    value: single(activeLanguages, LOCALES.length),
  })

  return {
    groups,
    onReset: () => {
      resetFilters()
      setTab(null)
    },
    search: placement => (
      <SearchInput
        className="w-full"
        hotkey={placement === 'panel' ? SHORTCUTS.filter.key : undefined}
        placeholder={t('searchPlaceholder')}
        urlKey="q"
      />
    ),
    searchActive: searching,
  }
}
