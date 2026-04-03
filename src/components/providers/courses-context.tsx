'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import {
  createCourse as createCourseAction,
  deleteCourse as deleteCouseAction,
  updateCourse as updateCourseAction,
} from '@/actions/courses/management'
import { listCourses } from '@/actions/courses/queries'
import { type Course, type SkillGroup } from '@/db/queries/course'
import { type TableInsert, type TableUpdate } from '@/db/types'
import { useI18n } from '@/hooks/use-i18n'

export interface CoursesContextValue {
  courses: Course[]
  skillGroups: SkillGroup[]
}

const useCoursesContext = (value: CoursesContextValue) => {
  const { localize } = useI18n()

  const [courses, setCourses] = useState(value.courses)

  useEffect(() => {
    setCourses(value.courses)
  }, [value.courses])

  const skillGroups = useMemo(
    () =>
      value.skillGroups.map(group => ({
        ...group,
        label: localize(group.name),
        value: String(group.id),
      })),
    [localize, value.skillGroups]
  )

  const setCourse = useCallback(
    (handler: React.SetStateAction<Course>) =>
      setCourses(prev =>
        prev.map(course => {
          const data = typeof handler === 'function' ? handler(course) : handler
          return course.id === data.id ? { ...course, ...data } : course
        })
      ),
    []
  )

  const createCourse = useCallback(
    async (payload: Omit<TableInsert<'courses'>, 'creatorId'>) => {
      const { data, error } = await createCourseAction({
        ...payload,
        sortOrder: courses.length + 1,
      })
      if (error) return { error }
      setCourses(prev => [...prev, data])
      return { data }
    },
    [courses.length]
  )

  const updateCourse = useCallback(async (id: number, payload: TableUpdate<'courses'>) => {
    setCourses(prev => prev.map(course => (course.id === id ? ({ ...course, ...payload } as Course) : course)))
    return await updateCourseAction(id, payload)
  }, [])

  const deleteCourse = useCallback(async (id: number) => {
    const { error } = await deleteCouseAction(id)
    if (error) throw error
    setCourses(prev => prev.filter(c => c.id !== id))
  }, [])

  const refreshCourses = useCallback(async () => {
    const { data, error } = await listCourses({ cache: false })
    if (error) return
    setCourses(data)
  }, [])

  return useMemo(
    () => ({
      courses,
      skillGroups,
      setCourses,
      setCourse,
      createCourse,
      updateCourse,
      deleteCourse,
      refreshCourses,
    }),
    [courses, createCourse, deleteCourse, refreshCourses, setCourse, skillGroups, updateCourse]
  )
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
