'use client'

import { createContext, useCallback, useState } from 'react'

import {
  type Course,
  type CreateCourseOptions,
  type CurrentUser,
  createCourse,
  DEFAULT_COURSE_TITLE,
  deleteCourse,
  type UpdateCourseOptions,
  type UserOrganization,
  updateCourse,
} from '@/lib/data'

export interface SessionContext {
  user: CurrentUser
  setUser?: React.Dispatch<React.SetStateAction<CurrentUser>>
  organization?: UserOrganization
  courses: Course[]
  createCourse?: (payload: Omit<CreateCourseOptions, 'title'>) => Promise<Course>
  updateCourse?: (value: React.SetStateAction<UpdateCourseOptions>) => Promise<Course>
  deleteCourse?: (id: number) => Promise<void>
}

export const SessionContext = createContext<SessionContext | null>(null)

export const SessionProvider = ({ children, ...context }: React.PropsWithChildren<SessionContext>) => {
  const [courses, setCourses] = useState<Course[]>(context.courses)
  const [user, setUser] = useState<CurrentUser>(context.user)
  const [organization] = useState<UserOrganization | undefined>(context.organization)

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
    async (payload: Omit<CreateCourseOptions, 'title'>) => {
      const title = DEFAULT_COURSE_TITLE
      const course = await createCourse({ ...payload, title })
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
        courses,
        createCourse: createSessionCourse,
        updateCourse: updateSessionCourse,
        deleteCourse: deleteSessionCourse,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}
