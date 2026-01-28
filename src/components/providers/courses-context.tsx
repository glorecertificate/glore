'use client'

import { createContext, startTransition, useCallback, useContext, useMemo, useOptimistic } from 'react'

import { createCourse as createCourseAction } from '@/actions/course'
import { type Course, type SkillGroup } from '@/db/queries/course'
import { type TableInsert } from '@/db/types'
import { useI18n } from '@/hooks/use-i18n'

export interface CoursesContextValue {
  courses: Course[]
  skillGroups: SkillGroup[]
}

const useCoursesContext = (value: CoursesContextValue) => {
  const { localize } = useI18n()

  const [courses, setCourses] = useOptimistic(
    value.courses,
    (courses: Course[], action: React.SetStateAction<Course[]>) =>
      typeof action === 'function' ? action(courses) : action
  )

  const skillGroups = useMemo(
    () =>
      value.skillGroups.map(group => ({
        ...group,
        label: localize(group.name),
        value: String(group.id),
      })),
    [localize, value.skillGroups]
  )

  const createCourse = useCallback(
    (data: TableInsert<'courses'>) => {
      const payload = { sort_order: courses.length + 1, ...data }

      startTransition(async () => {
        setCourses(prev => [...prev, { id: 0, ...payload } as Course])
        const course = await createCourseAction(payload)
        setCourses(prev => prev.map(c => (c.id === 0 ? course : c)))
      })
    },
    [courses.length, setCourses]
  )

  return useMemo(() => ({ courses, skillGroups, createCourse }), [courses, createCourse, skillGroups])
}

const CoursesContext = createContext<ReturnType<typeof useCoursesContext> | null>(null)

export const CoursesContextProvider = ({ value, ...props }: React.ProviderProps<CoursesContextValue>) => {
  const providerValue = useCoursesContext(value)
  return <CoursesContext.Provider value={providerValue} {...props} />
}

export const useCourses = () => {
  const context = useContext(CoursesContext)
  if (!context) throw new Error('useCourses must be used within a CoursesContextProvider')
  return context
}
