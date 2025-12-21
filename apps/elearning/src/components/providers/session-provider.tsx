'use client'

import { createContext, useCallback, useContext, useState } from 'react'

import { createCourse, deleteCourse, updateCourse } from '@/actions/course'
import type { Course, SkillGroup, User, UserOrganization } from '@/db/queries'
import type { TableInsert, TableUpdate } from '@/db/types'

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

  const addCourse = useCallback(
    async (coursesLanguage: TableInsert<'courses'>) => {
      const { data, error } = await createCourse(coursesLanguage)
      if (error) throw error
      setCourse(data)
      return data
    },
    [setCourse]
  )

  const editCourse = useCallback(
    async (id: number, course: TableUpdate<'courses'>) => {
      const { data, error } = await updateCourse(id, course)
      if (error) throw error
      setCourse(data)
      return data
    },
    [setCourse]
  )

  const editCourseSettings = useCallback(
    async (id: number, settings: Pick<Course, 'type'>) => {
      const { data, error } = await updateCourse(id, settings)
      if (error) throw error
      setCourse(data)
      return data
    },
    [setCourse]
  )

  const removeCourse = useCallback(
    async (id: number) => {
      const { error } = await deleteCourse(id)
      if (error) throw error
      context.setCourses(courses => courses.filter(course => course.id !== id))
    },
    [context.setCourses]
  )

  return {
    ...context,
    setCourse,
    addCourse,
    editCourse,
    editCourseSettings,
    removeCourse,
  }
}
