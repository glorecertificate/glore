'use client'

import { useSearchParams } from 'next/navigation'
import { startTransition, useEffect, useRef } from 'react'

import { type Locale } from 'next-intl'
import { parseAsArrayOf, parseAsString, parseAsStringEnum, useQueryState } from 'nuqs'

import { useCourses } from '@/components/features/courses/context'
import { resolveCourseLanguage, useCourseLanguages } from '@/components/features/courses/course-languages'
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
import { isListedCourse, listedCourseTypes } from '@/components/features/courses/visibility'
import { useI18n } from '@/components/providers/i18n'
import { useSession } from '@/components/providers/session'
import { COURSE_TYPES, type CourseSummary } from '@/db/queries/course'
import { type EnumType } from '@/db/types'
import { useCookies } from '@/hooks/use-cookies'
import { useSearch } from '@/hooks/use-search'
import { LOCALES, localizeRecord } from '@/lib/i18n'
import { CamelCase, type Enum } from '@/lib/types'
import { camelize, pluck } from '@/lib/utils'

const tabParser = parseAsStringEnum(COURSE_LIST_TABS).withDefault('all')
const typesParser = parseAsArrayOf(parseAsStringEnum(COURSE_TYPES))
const languagesParser = parseAsArrayOf(parseAsStringEnum(LOCALES))
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
  const { user } = useSession()
  const [rawTypes, setTypesRaw] = useQueryState(COURSE_LIST_PARAMS.TYPES, {
    ...typesParser,
    ...paramsOptions,
  })
  const listedTypes = listedCourseTypes(user)
  const selectedTypes = (rawTypes ?? []).filter(type => listedTypes.includes(type))
  const activeTypes =
    selectedTypes.length === 0 || selectedTypes.length === listedTypes.length ? [...COURSE_TYPES] : selectedTypes
  const setActiveTypes = (types: EnumType<'course_type'>[] | null) => setTypesRaw(types)
  return { activeTypes, selectedTypes, setActiveTypes }
}

export const useCourseListLanguages = () => {
  const [rawLanguages, setLanguagesRaw] = useQueryState(COURSE_LIST_PARAMS.LANGUAGES, {
    ...languagesParser,
    ...paramsOptions,
  })
  const selectedLanguages = rawLanguages ?? []
  const activeLanguages = selectedLanguages.length > 0 ? selectedLanguages : [...LOCALES]
  const setActiveLanguages = (languages: Locale[] | null) => setLanguagesRaw(languages)
  return { activeLanguages, selectedLanguages, setActiveLanguages }
}

export const useCourseListSkillGroups = () => {
  const { user } = useSession()
  const { skillGroups } = useCourses()

  const [rawSkillGroups, setSkillGroupsRaw] = useQueryState(COURSE_LIST_PARAMS.SKILL_GROUPS, {
    ...skillGroupsParser,
    ...paramsOptions,
  })

  const defaultSkillGroups = pluck(skillGroups, 'value')
  const listsSkills = listedCourseTypes(user).includes('skill')
  const selectedSkillGroups = listsSkills ? (rawSkillGroups ?? []) : []
  const activeSkillGroups = selectedSkillGroups.length > 0 ? selectedSkillGroups : defaultSkillGroups

  const setActiveSkillGroups = (groups: string[] | null) => setSkillGroupsRaw(groups)

  return { activeSkillGroups, selectedSkillGroups, setActiveSkillGroups, defaultSkillGroups }
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
    activeLanguages.length < LOCALES.length ||
    activeSkillGroups.length < skillGroups.length ||
    sort !== null ||
    searchValue.length > 0

  const filterCount =
    Number(COURSE_TYPES.some(t => !activeTypes.includes(t))) +
    Number(activeLanguages.length < LOCALES.length) +
    Number(activeSkillGroups.length < skillGroups.length) +
    Number(sort !== null)

  const resetFilters = () => {
    setActiveTypes(null)
    setActiveLanguages(null)
    setActiveSkillGroups(null)
    setSort(null)
    setSearch(null)
  }

  return { filterCount, hasFilters, resetFilters }
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
    const list: Record<CamelCase<CourseListTab>, CourseSummary[]> = {
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

      if (!isListedCourse(course, user)) continue

      list.all.push(course)

      if (isViewer) continue

      list[course.progressStatus].push(course)
    }

    return list
  })()

  return { courseList }
}

interface CourseFacets {
  groups: string[]
  languages: Locale[]
  skillGroupCount: number
  types: EnumType<'course_type'>[]
}

export const matchesFacets = (course: CourseSummary, facets: CourseFacets) => {
  if (facets.languages.length < LOCALES.length) {
    if (course.publicationStatus === 'draft') return false
    if (!course.languages || course.languages.length === 0) return false
    if (!course.languages.some(language => facets.languages.includes(language))) return false
  }
  if (facets.types.length < COURSE_TYPES.length && !facets.types.includes(course.type)) return false
  if (facets.groups.length < facets.skillGroupCount) {
    const group = course.skillGroup?.id.toString()
    if (!(group && facets.groups.includes(group))) return false
  }
  return true
}

const PROGRESS_RANK = { completed: 2, inProgress: 0, notStarted: 1 } as const

const bySortOrder = (a: CourseSummary, b: CourseSummary) => {
  if (a.sortOrder === null || b.sortOrder === null) return 0
  return a.sortOrder - b.sortOrder
}

const byProgress = (a: CourseSummary, b: CourseSummary) =>
  PROGRESS_RANK[a.progressStatus] - PROGRESS_RANK[b.progressStatus] || bySortOrder(a, b)

export const useCourseListFacets = () => {
  const { skillGroups } = useCourses()
  const { activeTypes } = useCourseListTypes()
  const { activeLanguages } = useCourseListLanguages()
  const { activeSkillGroups } = useCourseListSkillGroups()

  return {
    groups: activeSkillGroups,
    languages: activeLanguages,
    skillGroupCount: skillGroups.length,
    types: activeTypes,
  } satisfies CourseFacets
}

export const useDisplayCourses = () => {
  const { user } = useSession()
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
  const facets = useCourseListFacets()

  const hasFilters =
    activeTypes.length < COURSE_TYPES.length ||
    activeLanguages.length < LOCALES.length ||
    activeSkillGroups.length < skillGroups.length ||
    searching

  const isDefaultView = !(sort || hasFilters)

  const displayCourses = (() => {
    const data = courseList[camelize(tab as CourseListTab)]
    if (data.length < 2) return data
    if (isDefaultView) return user.canEdit ? data : data.toSorted(byProgress)

    let values = data.values().filter(course => matchesFacets(course, facets))

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
          return user.canEdit ? bySortOrder(a, b) : byProgress(a, b)
      }
    })
  })()

  return { displayCourses, hasFilters, isDefaultView }
}

export const useCourseListParams = () => {
  const searchParams = useSearchParams()
  const { current: cookies } = useRef(useCookies())
  const restoredRef = useRef(false)

  useEffect(() => {
    const params = searchParams.toString()
    const saved = restoredRef.current ? undefined : cookies.get('courseListParams')
    restoredRef.current = true
    if (!params && saved) {
      window.history.replaceState(null, '', `?${saved}`)
      return
    }
    if (params) {
      cookies.set('courseListParams', params)
      return
    }
    cookies.delete('courseListParams')
  }, [cookies, searchParams])
}
