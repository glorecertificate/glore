'use client'

import { createContext, useCallback, useContext, useState } from 'react'

import * as actions from '@/lib/actions/course'
import type { Course, SkillGroup, User, UserOrganization } from '@/lib/db/schema'
import type { DatabaseInsert, DatabaseUpdate } from '@/lib/db/types'

export interface SessionContext {
  courses: Course[]
  organization?: UserOrganization
  skillGroups: SkillGroup[]
  user: User
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>
  setUser: React.Dispatch<React.SetStateAction<User>>
  setOrganization: React.Dispatch<React.SetStateAction<UserOrganization | undefined>>
  setSkillGroups: React.Dispatch<React.SetStateAction<SkillGroup[]>>
}

export const SessionContext = createContext<SessionContext | null>(null)

export type SessionProviderProps = React.PropsWithChildren<
  Pick<SessionContext, 'courses' | 'organization' | 'skillGroups' | 'user'>
>

export const SessionProvider = ({ children, ...context }: SessionProviderProps) => {
  const [courses, setCourses] = useState(context.courses)
  const [user, setUser] = useState(context.user)
  const [organization, setOrganization] = useState(context.organization)
  const [skillGroups, setSkillGroups] = useState(context.skillGroups ?? [])

  return (
    <SessionContext.Provider
      value={{
        courses,
        organization,
        skillGroups,
        user,
        setCourses,
        setUser,
        setOrganization,
        setSkillGroups,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used within a SessionProvider')

  const setCourse = useCallback(
    (course: Partial<Course> & { id: number }) => {
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
    async (data: DatabaseInsert<'courses'>) => {
      const course = await actions.createCourse(data)
      setCourse(course)
      return course
    },
    [setCourse]
  )

  const updateCourse = useCallback(
    async (id: number, data: DatabaseUpdate<'courses'>) => {
      const course = await actions.updateCourse(id, data)
      setCourse(course)
      return course
    },
    [setCourse]
  )

  const updateCourseSettings = useCallback(
    async (id: number, data: Pick<Course, 'type'>) => {
      const course = await actions.updateCourse(id, data)
      setCourse(course)
      return course
    },
    [setCourse]
  )

  const deleteCourse = useCallback(
    async (id: number) => {
      await actions.deleteCourse(id)
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
