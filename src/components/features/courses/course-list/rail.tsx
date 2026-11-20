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

const chosen = <T,>(values: string[]) => (values.length > 0 ? (values as T[]) : null)

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
  const { selectedTypes, setActiveTypes } = useCourseListTypes()
  const { selectedLanguages, setActiveLanguages } = useCourseListLanguages()
  const { selectedSkillGroups, setActiveSkillGroups } = useCourseListSkillGroups()
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
      onChange: values => setTab((values[0] as CourseListTab | undefined) ?? 'all'),
      options: statusTabs.map(item => ({
        count: courseList[camelize(item)].filter(course => matchesFacets(course, facets)).length,
        label: t(item),
        tone: TAB_TONES[item],
        value: item,
      })),
      selection: 'single',
      values: tab === 'all' ? [] : [tab],
    })
  }

  groups.push({
    id: 'type',
    label: tCommon('courseType'),
    onChange: values => setActiveTypes(chosen<(typeof COURSE_TYPES)[number]>(values)),
    options: listedTypes.map(type => ({
      count: countWith({ types: [type] }),
      label: tCommon(`courseType-${type}`),
      value: type,
    })),
    values: selectedTypes,
  })

  if (skillGroups.length > 0 && listedTypes.includes('skill')) {
    groups.push({
      id: 'group',
      label: tCommon('skillGroup'),
      onChange: values => setActiveSkillGroups(chosen<string>(values)),
      options: skillGroups.map(group => ({
        count: countWith({ groups: [group.value] }),
        label: localize(group.name) ?? group.label,
        value: group.value,
      })),
      values: selectedSkillGroups,
    })
  }

  groups.push({
    id: 'language',
    label: t('language'),
    onChange: values => setActiveLanguages(chosen<(typeof LOCALES)[number]>(values)),
    options: localeItems.map(item => ({
      count: countWith({ languages: [item.value] }),
      label: item.label,
      value: item.value,
    })),
    values: selectedLanguages,
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
