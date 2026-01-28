'use client'

import { createContext, useContext, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { type Locale, useTranslations } from 'next-intl'
import { type Options, parseAsArrayOf, parseAsInteger, parseAsStringEnum, useQueryState } from 'nuqs'
import { toast } from 'sonner'
import { type CamelCase } from 'type-fest'

import { useCourses } from '@/components/providers/courses-context'
import { type Course } from '@/db/queries/course'
import { type TableInsert } from '@/db/types'
import { useI18n } from '@/hooks/use-i18n'
import { useSession } from '@/hooks/use-session'
import { COURSE_LIST_PARAMS } from '@/lib/constants'
import { i18n } from '@/lib/i18n'
import { camelize } from '@/lib/utils'

export const COURSE_LIST_EDITOR_TABS = ['all', 'published', 'partial', 'draft', 'archived'] as const
export const COURSE_LIST_LEARNER_TABS = ['all', 'not_started', 'in_progress', 'completed'] as const
export const COURSE_LIST_TABS = [...COURSE_LIST_EDITOR_TABS, ...COURSE_LIST_LEARNER_TABS]

export type CourseListTab = (typeof COURSE_LIST_EDITOR_TABS | typeof COURSE_LIST_LEARNER_TABS)[number]

export const COURSE_LIST_EDITOR_SORTS = ['name', 'type', 'skill_group', 'creation', 'update'] as const
export const COURSE_LIST_LEARNER_SORTS = ['progress', 'type', 'skill_group', 'name'] as const
export const COURSE_LIST_SORTS = [...COURSE_LIST_EDITOR_SORTS, ...COURSE_LIST_LEARNER_SORTS]

export type CourseListSortType =
  | 'default'
  | (typeof COURSE_LIST_EDITOR_SORTS | typeof COURSE_LIST_LEARNER_SORTS)[number]
export type CourseListSortDirection = 'asc' | 'desc'

const COURSE_LIST_PARAMS_OPTIONS = {
  history: 'push',
  shallow: true,
} satisfies Options

const tabParser = parseAsStringEnum(COURSE_LIST_TABS)
const languagesParser = parseAsArrayOf(parseAsStringEnum(i18n.locales))
const skillGroupsParser = parseAsArrayOf(parseAsInteger)
const sortParser = parseAsStringEnum(COURSE_LIST_SORTS)
const sortDirectionParser = parseAsStringEnum(['asc', 'desc'])

export interface CourseListContextValue {
  courseLanguages?: Record<string, Locale>
  params: {
    [COURSE_LIST_PARAMS.TAB]: CourseListTab
    [COURSE_LIST_PARAMS.LANGUAGES]: Locale[]
    [COURSE_LIST_PARAMS.SKILL_GROUPS]: number[]
    [COURSE_LIST_PARAMS.SORT]: CourseListSortType
    [COURSE_LIST_PARAMS.SORT_DIRECTION]: CourseListSortDirection
  }
}

const useCourseListContext = (value: CourseListContextValue) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale, localize } = useI18n()
  const t = useTranslations('Courses')

  const { user } = useSession()
  const { courses, skillGroups, createCourse } = useCourses()

  const [, setTab] = useQueryState(
    COURSE_LIST_PARAMS.TAB,
    tabParser.withOptions(COURSE_LIST_PARAMS_OPTIONS).withDefault(value.params[COURSE_LIST_PARAMS.TAB])
  )
  const tabParam = searchParams.get(COURSE_LIST_PARAMS.TAB)
  const tabParamValue = tabParam ? tabParser.parse(tabParam) : null
  const tab = tabParamValue ?? value.params[COURSE_LIST_PARAMS.TAB]

  const [, setActiveGroups] = useQueryState(
    COURSE_LIST_PARAMS.SKILL_GROUPS,
    skillGroupsParser.withOptions(COURSE_LIST_PARAMS_OPTIONS)
  )
  const activeSkillGroupsParam = searchParams.get(COURSE_LIST_PARAMS.SKILL_GROUPS)
  const activeSkillGroupsValue = activeSkillGroupsParam ? skillGroupsParser.parse(activeSkillGroupsParam) : null
  const activeSkillGroups = activeSkillGroupsValue ?? value.params[COURSE_LIST_PARAMS.SKILL_GROUPS]

  const [, setActiveLanguages] = useQueryState(
    COURSE_LIST_PARAMS.LANGUAGES,
    languagesParser.withOptions(COURSE_LIST_PARAMS_OPTIONS).withDefault(value.params[COURSE_LIST_PARAMS.LANGUAGES])
  )
  const activeLanguagesParam = searchParams.get(COURSE_LIST_PARAMS.LANGUAGES)
  const activeLanguagesValue = activeLanguagesParam ? languagesParser.parse(activeLanguagesParam) : null
  const activeLanguages = activeLanguagesValue ?? value.params[COURSE_LIST_PARAMS.LANGUAGES]

  const [, setSort] = useQueryState(COURSE_LIST_PARAMS.SORT, sortParser.withOptions(COURSE_LIST_PARAMS_OPTIONS))
  const sortParam = searchParams.get(COURSE_LIST_PARAMS.SORT)
  const sortValue = sortParam ? sortParser.parse(sortParam) : null
  const sort = sortValue ?? value.params[COURSE_LIST_PARAMS.SORT]

  const [, setSortDirection] = useQueryState(
    COURSE_LIST_PARAMS.SORT_DIRECTION,
    sortDirectionParser
      .withOptions(COURSE_LIST_PARAMS_OPTIONS)
      .withDefault(value.params[COURSE_LIST_PARAMS.SORT_DIRECTION])
  )
  const sortDirectionParam = searchParams.get(COURSE_LIST_PARAMS.SORT_DIRECTION)
  const sortDirectionValue = sortDirectionParam ? sortDirectionParser.parse(sortDirectionParam) : null
  const sortDirection = sortDirectionValue ?? value.params[COURSE_LIST_PARAMS.SORT_DIRECTION]

  const tabs = useMemo(
    () =>
      user.canEdit
        ? (activeLanguages ?? []).length > 1
          ? COURSE_LIST_EDITOR_TABS
          : COURSE_LIST_EDITOR_TABS.filter(tab => tab !== 'partial')
        : COURSE_LIST_LEARNER_TABS,
    [activeLanguages, user.canEdit]
  )

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

    const currentLanguages = activeLanguages ?? []

    for (const course of courses) {
      if (course.archived_at) {
        list.archived.push(course)
        continue
      }

      list.all.push(course)

      if (!user.canEdit) {
        switch (course.progressStatus) {
          case 'not_started':
            list.notStarted.push(course)
            continue
          case 'in_progress':
            list.inProgress.push(course)
            continue
          case 'completed':
            list.completed.push(course)
            continue
        }
      }

      const courseLanguages = course.languages ?? []
      let matchCount = 0

      for (const lang of currentLanguages) {
        if (courseLanguages.includes(lang)) {
          matchCount++
        }
      }

      if (matchCount === currentLanguages.length && currentLanguages.length > 0) {
        list.published.push(course)
        continue
      }
      if (matchCount > 0) {
        list.partial.push(course)
        continue
      }

      list.draft.push(course)
    }

    return list
  }, [activeLanguages, courses, user.canEdit])

  const hasSort = useMemo(() => sort !== 'default', [sort])

  const hasFilters = useMemo(
    () => activeLanguages.length < i18n.locales.length || activeSkillGroups.length < skillGroups.length,
    [activeLanguages, activeSkillGroups, skillGroups.length]
  )

  const isDefaultView = useMemo(() => !(hasSort || hasFilters), [hasFilters, hasSort])

  const displayCourses = useMemo(() => {
    let data = courseList[camelize(tab as CourseListTab)]
    if (data.length < 2 || isDefaultView) return data

    if (activeSkillGroups.length < skillGroups.length) {
      data = data.filter(course => {
        const courseSkillGroup = course.skill_group?.id
        return courseSkillGroup ? activeSkillGroups.includes(courseSkillGroup) : false
      })
    }

    return data
      .values()
      .map(course => {
        const cookieLanguage = value.courseLanguages?.[String(course.id)]
        if (cookieLanguage && (activeLanguages ?? []).includes(cookieLanguage)) {
          return { ...course, language: cookieLanguage }
        }
        return {
          ...course,
          language: course.languages?.includes(locale) ? locale : course.languages?.[0],
        }
      })
      .toArray()
      .sort((a, b) => {
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
          case 'skill_group': {
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
    activeLanguages,
    courseList,
    sort,
    sortDirection,
    tab,
    locale,
    localize,
    value.courseLanguages,
    isDefaultView,
    activeSkillGroups.includes,
    activeSkillGroups.length,
    skillGroups.length,
  ])

  const addCourse = useMemo(
    () => async (data: TableInsert<'courses'>) => {
      await createCourse({ ...data, sort_order: courseList.all.length + 1 })
      router.push(`/courses/${data.slug}`)
      toast.success(t('courseCreated'), { duration: 4000 })
    },
    [courseList.all.length, createCourse, router.push, t]
  )

  return useMemo(
    () => ({
      activeSkillGroups,
      activeLanguages,
      courseList,
      courses,
      displayCourses,
      hasFilters,
      skillGroups,
      sort,
      sortDirection,
      t,
      tab,
      tabs,
      addCourse,
      setActiveGroups,
      setActiveLanguages,
      setSort,
      setSortDirection,
      setTab,
    }),
    [
      activeLanguages,
      activeSkillGroups,
      addCourse,
      courseList,
      courses,
      displayCourses,
      setActiveGroups,
      setActiveLanguages,
      setSort,
      setSortDirection,
      setTab,
      skillGroups,
      sort,
      sortDirection,
      t,
      tab,
      tabs,
      hasFilters,
    ]
  )
}

const CourseListContext = createContext<ReturnType<typeof useCourseListContext> | null>(null)

export const CourseListContextProvider = ({ value, ...props }: React.ProviderProps<CourseListContextValue>) => {
  const providerValue = useCourseListContext(value)
  return <CourseListContext.Provider value={providerValue} {...props} />
}

export const useCourseList = () => {
  const context = useContext(CourseListContext)
  if (!context) throw new Error('useCourseList must be used within a CourseListContextProvider')
  return context
}
