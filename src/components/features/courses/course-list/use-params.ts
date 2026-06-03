'use client'

import { useSearchParams } from 'next/navigation'
import { startTransition, useEffect, useRef } from 'react'

import { type Locale } from 'next-intl'
import { parseAsArrayOf, parseAsString, parseAsStringEnum, useQueryState } from 'nuqs'

import {
  COURSE_LIST_EDITOR_TABS,
  COURSE_LIST_LEARNER_TABS,
  COURSE_LIST_PARAMS,
  COURSE_LIST_SORTS,
  COURSE_LIST_TABS,
  COURSE_LIST_VIEWER_TABS,
  type CourseListSortDirection,
  type CourseListSortType,
  type CourseListTab,
} from '@/components/features/courses/course-list/params'
import { resolveCourseLanguage, useCourseLanguages } from '@/components/providers/course-languages-context'
import { useCourses } from '@/components/providers/courses-context'
import { COURSE_TYPES, type Course } from '@/db/queries/course'
import { type EnumType } from '@/db/types'
import { useCookies } from '@/hooks/use-cookies'
import { useI18n } from '@/hooks/use-i18n'
import { useSearch } from '@/hooks/use-search'
import { useSession } from '@/hooks/use-session'
import { i18n, localizeRecord } from '@/lib/i18n'
import { CamelCase, type Enum } from '@/lib/types'
import { camelize, pluck } from '@/lib/utils'

const tabParser = parseAsStringEnum(COURSE_LIST_TABS).withDefault('all')
const typesParser = parseAsArrayOf(parseAsStringEnum(COURSE_TYPES)).withDefault([...COURSE_TYPES])
const languagesParser = parseAsArrayOf(parseAsStringEnum(i18n.locales)).withDefault(i18n.locales)
const skillGroupsParser = parseAsArrayOf(parseAsString)
const sortParser = parseAsStringEnum(COURSE_LIST_SORTS)
const sortDirectionParser = parseAsStringEnum<CourseListSortDirection>(['asc', 'desc']).withDefault('asc')

const paramsOptions = { history: 'push', startTransition } as const

export const useCourseListTab = () => {
  const [tab, setTabRaw] = useQueryState(COURSE_LIST_PARAMS.TAB, { ...tabParser, ...paramsOptions })
  const setTab = (newTab: CourseListTab | null) => setTabRaw(newTab)
  return { tab, setTab }
}

export const useCourseListTypes = () => {
  const [activeTypes, setTypesRaw] = useQueryState(COURSE_LIST_PARAMS.TYPES, {
    ...typesParser,
    ...paramsOptions,
  })
  const setActiveTypes = (types: EnumType<'course_type'>[] | null) => setTypesRaw(types)
  return { activeTypes, setActiveTypes }
}

export const useCourseListLanguages = () => {
  const [activeLanguages, setLanguagesRaw] = useQueryState(COURSE_LIST_PARAMS.LANGUAGES, {
    ...languagesParser,
    ...paramsOptions,
  })
  const setActiveLanguages = (languages: Locale[] | null) => setLanguagesRaw(languages)
  return { activeLanguages, setActiveLanguages }
}

export const useCourseListSkillGroups = () => {
  const { skillGroups } = useCourses()

  const [rawSkillGroups, setSkillGroupsRaw] = useQueryState(COURSE_LIST_PARAMS.SKILL_GROUPS, {
    ...skillGroupsParser,
    ...paramsOptions,
  })

  const defaultSkillGroups = pluck(skillGroups, 'value')
  const activeSkillGroups = rawSkillGroups ?? defaultSkillGroups

  const setActiveSkillGroups = (groups: string[] | null) => setSkillGroupsRaw(groups)

  return { activeSkillGroups, setActiveSkillGroups, defaultSkillGroups }
}

export const useCourseListSearch = () => useSearch({ urlKey: COURSE_LIST_PARAMS.SEARCH })

export const useCourseListSort = () => {
  const [sort, setSortRaw] = useQueryState(COURSE_LIST_PARAMS.SORT, { ...sortParser, ...paramsOptions })
  const [sortDirection, setSortDirectionRaw] = useQueryState(COURSE_LIST_PARAMS.SORT_DIRECTION, {
    ...sortDirectionParser,
    ...paramsOptions,
  })

  const setSort = (newSort: CourseListSortType | null) => setSortRaw(newSort)

  const setSortDirection = (direction: Enum<CourseListSortDirection> | null) => setSortDirectionRaw(direction)

  return { sort, sortDirection, setSort, setSortDirection }
}

export const useCourseListFilters = () => {
  const { activeTypes, setActiveTypes } = useCourseListTypes()
  const { activeLanguages, setActiveLanguages } = useCourseListLanguages()
  const { activeSkillGroups, setActiveSkillGroups } = useCourseListSkillGroups()
  const { sort, setSort } = useCourseListSort()
  const { searchValue, setSearch } = useCourseListSearch()
  const { skillGroups } = useCourses()

  const hasFilters =
    COURSE_TYPES.some(t => !activeTypes.includes(t)) ||
    activeLanguages.length < i18n.locales.length ||
    activeSkillGroups.length < skillGroups.length ||
    sort !== null ||
    searchValue.length > 0

  const resetFilters = () => {
    setActiveTypes(null)
    setActiveLanguages(null)
    setActiveSkillGroups(null)
    setSort(null)
    setSearch(null)
  }

  return { hasFilters, resetFilters }
}

export const useCourseListTabs = () => {
  const { user } = useSession()
  const { activeLanguages } = useCourseListLanguages()
  const isViewer = user.isOrgAdmin || user.isRepresentative || user.isTutor

  const tabs = (() => {
    if (user.canEdit) {
      return (activeLanguages ?? []).length > 1
        ? COURSE_LIST_EDITOR_TABS
        : COURSE_LIST_EDITOR_TABS.filter(tab => tab !== 'partial')
    }
    if (isViewer) return COURSE_LIST_VIEWER_TABS
    return COURSE_LIST_LEARNER_TABS
  })()

  return { tabs }
}

export const useCourseList = () => {
  const { user } = useSession()
  const { courses } = useCourses()
  const isViewer = user.isOrgAdmin || user.isRepresentative || user.isTutor

  const courseList = (() => {
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
      if (user.canEdit) {
        if (course.archivedAt) {
          list.archived.push(course)
          continue
        }
        list.all.push(course)
        list[course.publicationStatus]?.push(course)
        continue
      }

      if (course.publicationStatus !== 'published') continue
      if (user.isLearner && course.type === 'skill') continue
      if (user.isVolunteer && course.type === 'learner') continue

      list.all.push(course)

      if (isViewer) continue

      list[course.progressStatus].push(course)
    }

    return list
  })()

  return { courseList }
}

export const useDisplayCourses = () => {
  const { locale, localize } = useI18n()
  const { skillGroups } = useCourses()
  const { tab } = useCourseListTab()
  const { activeTypes } = useCourseListTypes()
  const { activeLanguages } = useCourseListLanguages()
  const { activeSkillGroups } = useCourseListSkillGroups()
  const { sort, sortDirection } = useCourseListSort()
  const { searching, matchSearch } = useCourseListSearch()
  const { languages: cardLanguages } = useCourseLanguages()
  const { courseList } = useCourseList()

  const hasFilters =
    activeTypes.length < COURSE_TYPES.length ||
    activeLanguages.length < i18n.locales.length ||
    activeSkillGroups.length < skillGroups.length ||
    searching

  const isDefaultView = !(sort || hasFilters)

  const displayCourses = (() => {
    const data = courseList[camelize(tab as CourseListTab)]
    if (data.length < 2 || isDefaultView) return data

    let values = data.values()

    if (activeLanguages.length < i18n.locales.length) {
      values = values.filter(course => {
        if (course.publicationStatus === 'draft') return false
        if (!course.languages || course.languages.length === 0) return false
        return course.languages.some(language => activeLanguages.includes(language))
      })
    }

    if (activeTypes.length < COURSE_TYPES.length) {
      values = values.filter(course => activeTypes.includes(course.type))
    }

    if (activeSkillGroups.length < skillGroups.length) {
      values = values.filter(course => {
        const courseSkillGroup = course.skillGroup?.id.toString()
        return courseSkillGroup ? activeSkillGroups.includes(courseSkillGroup) : false
      })
    }

    if (searching) {
      values = values.filter(course => {
        const language = resolveCourseLanguage(cardLanguages, course.id, { activeLanguages, fallback: locale })
        const title = localizeRecord(course.title, language)
        const description = course.description ? localizeRecord(course.description, language) : undefined
        return matchSearch([course.slug, title, description])
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
          if (a.progress === null || b.progress === null) return 0
          return sortDirection === 'asc' ? a.progress - b.progress : b.progress - a.progress
        }
        case 'skillGroup': {
          if (!(a.skillGroup?.name && b.skillGroup?.name)) return 0
          const skillA = localize(a.skillGroup.name)
          const skillB = localize(b.skillGroup.name)
          if (!(skillA && skillB)) return 0
          return sortDirection === 'asc' ? skillA.localeCompare(skillB) : skillB.localeCompare(skillA)
        }
        case 'creation': {
          if (!(a.createdAt && b.createdAt)) return 0
          return sortDirection === 'asc'
            ? a.createdAt.localeCompare(b.createdAt)
            : b.createdAt.localeCompare(a.createdAt)
        }
        case 'update': {
          if (!(a.updatedAt && b.updatedAt)) return 0
          return sortDirection === 'asc'
            ? a.updatedAt.localeCompare(b.updatedAt)
            : b.updatedAt.localeCompare(a.updatedAt)
        }
        case 'type': {
          if (!(a.type && b.type)) return 0
          return sortDirection === 'asc' ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type)
        }
        default:
          if (a.sortOrder === null || b.sortOrder === null) return 0
          return a.sortOrder - b.sortOrder
      }
    })
  })()

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
