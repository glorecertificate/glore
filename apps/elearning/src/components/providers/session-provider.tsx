'use client'

import { createContext, useCallback, useState } from 'react'

import {
  type Course,
  type CourseSettings,
  type CurrentUser,
  createCourse,
  deleteCourse,
  type SkillGroup,
  type UpdateCourseOptions,
  type UserOrganization,
  updateCourse,
  updateCourseSettings,
} from '@/lib/data'

export interface SessionContext {
  user: CurrentUser
  setUser?: React.Dispatch<React.SetStateAction<CurrentUser>>
  organization?: UserOrganization
  skillGroups: SkillGroup[]
  courses: Course[]
  createCourse?: (payload: CourseSettings) => Promise<Course>
  updateCourse?: (value: React.SetStateAction<UpdateCourseOptions>) => Promise<Course>
  updateCourseSettings?: (id: number, settings: CourseSettings) => Promise<Course>
  deleteCourse?: (id: number) => Promise<void>
}

export const SessionContext = createContext<SessionContext | null>(null)

export const SessionProvider = ({ children, ...context }: React.PropsWithChildren<SessionContext>) => {
  const [courses, setCourses] = useState(context.courses)
  const [user, setUser] = useState(context.user)
  const [organization] = useState(context.organization)
  const [skillGroups] = useState(context.skillGroups ?? [])

  const setCourse = useCallback((course: Course) => {
    setCourses(courses => {
      const index = courses.findIndex(({ id }) => id === course.id)
      if (index === -1) return [...courses, course]
      const next = [...courses]
      next[index] = course
      return next
    })
  }, [])

  const createSessionCourse = useCallback(
    async (settings: CourseSettings) => {
      const course = await createCourse(settings)
      setCourse(course)
      return course
    },
    [setCourse]
  )

  const updateSessionCourse = useCallback(
    async (value: React.SetStateAction<UpdateCourseOptions>) => {
      const payload = typeof value === 'function' ? value((value.arguments as UpdateCourseOptions[])[0]) : value
      const course = await updateCourse(payload)
      setCourse(course)
      return course
    },
    [setCourse]
  )

  const updateSessionCourseSettings = useCallback(
    async (id: number, settings: CourseSettings) => {
      const course = await updateCourseSettings(id, settings)
      setCourse(course)
      return course
    },
    [setCourse]
  )

  const deleteSessionCourse = useCallback(async (id: number) => {
    await deleteCourse(id)
    setCourses(courses => courses.filter(course => course.id !== id))
  }, [])

  return (
    <SessionContext.Provider
      value={{
        user,
        setUser,
        organization,
        skillGroups,
        courses,
        createCourse: createSessionCourse,
        updateCourse: updateSessionCourse,
        updateCourseSettings: updateSessionCourseSettings,
        deleteCourse: deleteSessionCourse,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}
