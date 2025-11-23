'use client'

import { useCallback, useContext } from 'react'

import { SessionContext } from '@/components/providers/session-provider'
import { type Course, type CourseInsert, type CourseUpdate } from '@/lib/data'
// biome-ignore lint: no-namespace-import
import * as client from '@/lib/data/repositories/courses/client'

export const useSession = () => {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used within a SessionProvider')

  const setCourse = useCallback(
    (course: CourseUpdate) => {
      context.setCourses(courses => {
        const index = courses.findIndex(({ id }) => id === course.id)
        if (index === -1) return [...courses, course as Course]
        const next = [...courses]
        next[index] = { ...next[index], ...course }
        return next
      })
    },
    [context.setCourses]
  )

  const createCourse = useCallback(
    async (data: CourseInsert) => {
      const course = await client.createCourse(data)
      setCourse(course)
      return course
    },
    [setCourse]
  )

  const updateCourse = useCallback(
    async (value: React.SetStateAction<Partial<CourseUpdate>>) => {
      const { id, ...updates } = typeof value === 'function' ? value(value.arguments[0]) : value
      if (!id) throw new Error('Invalid course id')
      const course = await client.updateCourse(id, updates)
      setCourse(course)
      return course
    },
    [setCourse]
  )

  const updateCourseSettings = useCallback(
    async (id: number, data: CourseInsert) => {
      const course = await client.updateCourseSettings(id, data)
      setCourse(course)
      return course
    },
    [setCourse]
  )

  const deleteCourse = useCallback(
    async (id: number) => {
      await client.deleteCourse(id)
      context.setCourses(courses => courses.filter(course => course.id !== id))
    },
    [context.setCourses]
  )

  return {
    ...context,
    createCourse,
    deleteCourse,
    setCourse,
    updateCourse,
    updateCourseSettings,
  }
}
