'use client'

import { createContext, use, useEffect, useState } from 'react'

import {
  createCourse as createCourseAction,
  deleteCourse as deleteCouseAction,
  updateCourse as updateCourseAction,
} from '@/actions/courses/management'
import { listCourses } from '@/actions/courses/queries'
import { type Course, type SkillGroup } from '@/db/queries/course'
import { type TableInsert, type TableUpdate } from '@/db/types'
import { useI18n } from '@/hooks/use-i18n'

interface CoursesContextValue {
  courses: Course[]
  skillGroups: SkillGroup[]
}

const useCoursesContext = (value: CoursesContextValue) => {
  const { localize } = useI18n()

  const [courses, setCourses] = useState(value.courses)

  useEffect(() => {
    setCourses(value.courses)
  }, [value.courses])

  const skillGroups = value.skillGroups.map(group => ({
    ...group,
    label: localize(group.name),
    value: String(group.id),
  }))

  const setCourse = (handler: React.SetStateAction<Course>) =>
    setCourses(prev =>
      prev.map(course => {
        const data = typeof handler === 'function' ? handler(course) : handler
        return course.id === data.id ? { ...course, ...data } : course
      })
    )

  const createCourse = async (payload: Omit<TableInsert<'courses'>, 'creatorId'>) => {
    const { data, error } = await createCourseAction({
      ...payload,
      sortOrder: courses.length + 1,
    })
    if (error) return { error }
    setCourses(prev => [...prev, data])
    return { data }
  }

  const updateCourse = async (id: number, payload: TableUpdate<'courses'>) => {
    setCourses(prev => prev.map(course => (course.id === id ? ({ ...course, ...payload } as Course) : course)))
    return await updateCourseAction(id, payload)
  }

  const deleteCourse = async (id: number) => {
    const { error } = await deleteCouseAction(id)
    if (error) throw error
    setCourses(prev => prev.filter(c => c.id !== id))
  }

  const refreshCourses = async () => {
    const { data, error } = await listCourses({ cache: false })
    if (error) return
    setCourses(data)
  }

  return {
    courses,
    skillGroups,
    setCourses,
    setCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    refreshCourses,
  }
}

const CoursesContext = createContext<ReturnType<typeof useCoursesContext> | null>(null)

export const CoursesContextProvider = ({ value, ...props }: React.ProviderProps<CoursesContextValue>) => {
  const providerValue = useCoursesContext(value)
  return <CoursesContext.Provider value={providerValue} {...props} />
}

export const useCourses = () => {
  const context = use(CoursesContext)
  if (!context) throw new Error('useCourses must be used within a CoursesContextProvider')
  return context
}
