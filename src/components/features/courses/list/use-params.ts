'use client'

import { startTransition, useCallback, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

import { type Locale } from 'next-intl'
import { parseAsArrayOf, parseAsString, parseAsStringEnum, useQueryState } from 'nuqs'

import {
  COURSE_LIST_EDITOR_TABS,
  COURSE_LIST_LEARNER_TABS,
  COURSE_LIST_PARAMS,
  COURSE_LIST_SORTS,
  COURSE_LIST_TABS,
  type CourseListSortDirection,
  type CourseListSortType,
  type CourseListTab,
} from '@/components/features/courses/list/params'
import { useCourses } from '@/components/providers/courses-context'
import { COURSE_TYPES, type Course } from '@/db/queries/course'
import { type Enums } from '@/db/types'
import { useCookies } from '@/hooks/use-cookies'
import { useI18n } from '@/hooks/use-i18n'
import { useSession } from '@/hooks/use-session'
import { i18n } from '@/lib/i18n'
import { type Enum } from '@/lib/types'
import { type CamelCase, camelize, pluck } from '@/lib/utils'

const tabParser = parseAsStringEnum(COURSE_LIST_TABS).withDefault('all')
const typesParser = parseAsArrayOf(parseAsStringEnum(COURSE_TYPES)).withDefault([...COURSE_TYPES])
const languagesParser = parseAsArrayOf(parseAsStringEnum(i18n.locales)).withDefault(i18n.locales)
const skillGroupsParser = parseAsArrayOf(parseAsString)
const sortParser = parseAsStringEnum(COURSE_LIST_SORTS)
const sortDirectionParser = parseAsStringEnum<CourseListSortDirection>(['asc', 'desc']).withDefault('asc')

const paramsOptions = { history: 'push', startTransition } as const

export const useCourseListTab = () => {
  const [tab, setTabRaw] = useQueryState(COURSE_LIST_PARAMS.TAB, { ...tabParser, ...paramsOptions })
  const setTab = useCallback((newTab: CourseListTab | null) => setTabRaw(newTab), [setTabRaw])
  return { tab, setTab }
}

export const useCourseListTypes = () => {
  const [activeTypes, setTypesRaw] = useQueryState(COURSE_LIST_PARAMS.TYPES, {
    ...typesParser,
    ...paramsOptions,
  })
  const setActiveTypes = useCallback((types: Enums<'course_type'>[] | null) => setTypesRaw(types), [setTypesRaw])
  return { activeTypes, setActiveTypes }
}

export const useCourseListLanguages = () => {
  const [activeLanguages, setLanguagesRaw] = useQueryState(COURSE_LIST_PARAMS.LANGUAGES, {
    ...languagesParser,
    ...paramsOptions,
  })
  const setActiveLanguages = useCallback((languages: Locale[] | null) => setLanguagesRaw(languages), [setLanguagesRaw])
  return { activeLanguages, setActiveLanguages }
}

export const useCourseListSkillGroups = () => {
  const { skillGroups } = useCourses()

  const [rawSkillGroups, setSkillGroupsRaw] = useQueryState(COURSE_LIST_PARAMS.SKILL_GROUPS, {
    ...skillGroupsParser,
    ...paramsOptions,
  })

  const defaultSkillGroups = useMemo(() => pluck(skillGroups, 'value'), [skillGroups])
  const activeSkillGroups = rawSkillGroups ?? defaultSkillGroups

  const setActiveSkillGroups = useCallback((groups: string[] | null) => setSkillGroupsRaw(groups), [setSkillGroupsRaw])

  return { activeSkillGroups, setActiveSkillGroups, defaultSkillGroups }
}

export const useCourseListSort = () => {
  const [sort, setSortRaw] = useQueryState(COURSE_LIST_PARAMS.SORT, { ...sortParser, ...paramsOptions })
  const [sortDirection, setSortDirectionRaw] = useQueryState(COURSE_LIST_PARAMS.SORT_DIRECTION, {
    ...sortDirectionParser,
    ...paramsOptions,
  })

  const setSort = useCallback((newSort: CourseListSortType | null) => setSortRaw(newSort), [setSortRaw])

  const setSortDirection = useCallback(
    (direction: Enum<CourseListSortDirection> | null) => setSortDirectionRaw(direction),
    [setSortDirectionRaw]
  )

  return { sort, sortDirection, setSort, setSortDirection }
}

export const useCourseListFilters = () => {
  const { activeTypes, setActiveTypes } = useCourseListTypes()
  const { activeLanguages, setActiveLanguages } = useCourseListLanguages()
  const { activeSkillGroups, setActiveSkillGroups } = useCourseListSkillGroups()
  const { setSort } = useCourseListSort()
  const { skillGroups } = useCourses()

  const hasFilters = useMemo(
    () =>
      activeTypes.length < COURSE_TYPES.length ||
      activeLanguages.length < i18n.locales.length ||
      activeSkillGroups.length < skillGroups.length,
    [activeTypes, activeLanguages, activeSkillGroups, skillGroups.length]
  )

  const resetFilters = useCallback(() => {
    setActiveTypes(null)
    setActiveLanguages(null)
    setActiveSkillGroups(null)
    setSort(null)
  }, [setActiveTypes, setActiveLanguages, setActiveSkillGroups, setSort])

  return { hasFilters, resetFilters }
}

export const useCourseListTabs = () => {
  const { user } = useSession()
  const { activeLanguages } = useCourseListLanguages()

  const tabs = useMemo(
    () =>
      user.canEdit
        ? (activeLanguages ?? []).length > 1
          ? COURSE_LIST_EDITOR_TABS
          : COURSE_LIST_EDITOR_TABS.filter(tab => tab !== 'partial')
        : COURSE_LIST_LEARNER_TABS,
    [activeLanguages, user.canEdit]
  )

  return { tabs }
}

export const useCourseList = () => {
  const { user } = useSession()
  const { courses } = useCourses()

  const courseList = useMemo<Record<CamelCase<CourseListTab>, Course[]>>(() => {
    const list: Record<CamelCase<CourseListTab>, Course[]> = {
      all: [],
      published: [],
      partial: [],
      draft: [],
      archived: [],
      notStarted: [],
      inProgress: [],
      completed: [],
    }

    for (const course of courses) {
      if (course.archived_at) {
        list.archived.push(course)
        continue
      }

      list.all.push(course)

      if (user.canEdit) {
        list[course.publicationStatus]?.push(course)
        continue
      }

      list[course.progressStatus].push(course)
    }

    return list
  }, [courses, user.canEdit])

  return { courseList }
}

export const useDisplayCourses = () => {
  const { localize } = useI18n()
  const { skillGroups } = useCourses()
  const { tab } = useCourseListTab()
  const { activeTypes } = useCourseListTypes()
  const { activeLanguages } = useCourseListLanguages()
  const { activeSkillGroups } = useCourseListSkillGroups()
  const { sort, sortDirection } = useCourseListSort()
  const { courseList } = useCourseList()

  const hasFilters = useMemo(
    () =>
      activeTypes.length < COURSE_TYPES.length ||
      activeLanguages.length < i18n.locales.length ||
      activeSkillGroups.length < skillGroups.length,
    [activeTypes, activeLanguages, activeSkillGroups, skillGroups.length]
  )

  const isDefaultView = useMemo(() => !(sort || hasFilters), [hasFilters, sort])

  const displayCourses = useMemo(() => {
    const data = courseList[camelize(tab as CourseListTab)]
    if (data.length < 2 || isDefaultView) return data

    let values = data.values()

    if (activeTypes.length < COURSE_TYPES.length) {
      values = values.filter(course => activeTypes.includes(course.type))
    }

    if (activeSkillGroups.length < skillGroups.length) {
      values = values.filter(course => {
        const courseSkillGroup = course.skill_group?.id.toString()
        return courseSkillGroup ? activeSkillGroups.includes(courseSkillGroup) : false
      })
    }

    return values.toArray().sort((a, b) => {
      switch (sort) {
        case 'name': {
          const titleA = localize(a.title)
          const titleB = localize(b.title)
          if (!(titleA && titleB)) return 0
          return sortDirection === 'asc' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA)
        }
        case 'progress': {
          if (a.progress == null || b.progress == null) return 0
          return sortDirection === 'asc' ? a.progress - b.progress : b.progress - a.progress
        }
        case 'skillGroup': {
          if (!(a.skill_group?.name && b.skill_group?.name)) return 0
          const skillA = localize(a.skill_group.name)
          const skillB = localize(b.skill_group.name)
          if (!(skillA && skillB)) return 0
          return sortDirection === 'asc' ? skillA.localeCompare(skillB) : skillB.localeCompare(skillA)
        }
        case 'creation': {
          if (!(a.created_at && b.created_at)) return 0
          return sortDirection === 'asc'
            ? a.created_at.localeCompare(b.created_at)
            : b.created_at.localeCompare(a.created_at)
        }
        case 'update': {
          if (!(a.updated_at && b.updated_at)) return 0
          return sortDirection === 'asc'
            ? a.updated_at.localeCompare(b.updated_at)
            : b.updated_at.localeCompare(a.updated_at)
        }
        case 'type': {
          if (!(a.type && b.type)) return 0
          return sortDirection === 'asc' ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type)
        }
        default:
          if (a.sort_order == null || b.sort_order == null) return 0
          return a.sort_order - b.sort_order
      }
    })
  }, [
    activeTypes,
    activeSkillGroups,
    courseList,
    isDefaultView,
    localize,
    skillGroups.length,
    sort,
    sortDirection,
    tab,
  ])

  return { displayCourses, hasFilters, isDefaultView }
}

export const useCourseListParams = () => {
  const searchParams = useSearchParams()
  const { current: cookies } = useRef(useCookies())

  useEffect(() => {
    const params = searchParams.toString()
    if (params) {
      cookies.set('courseListParams', params)
      return
    }
    cookies.delete('courseListParams')
  }, [cookies, searchParams])
}
