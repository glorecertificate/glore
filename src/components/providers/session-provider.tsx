'use client'

import { createContext, useCallback, useContext, useState } from 'react'

import { createCourse, deleteCourse, updateCourse } from '@/actions/course'
import { type Course, type SkillGroup } from '@/db/schema/courses'
import { type User, type UserOrganization } from '@/db/schema/users'
import { type TableInsert, type TableUpdate } from '@/db/types'

export const SessionContext = createContext<{
  addCourse: (course: TableInsert<'courses'>) => Promise<Course>
  courses: Course[]
  editSessionCourse: (id: number, course: TableUpdate<'courses'>) => Promise<Course>
  organization?: UserOrganization
  removeCourse: (id: number) => Promise<void>
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>
  setOrganization: React.Dispatch<React.SetStateAction<UserOrganization | undefined>>
  setSessionCourse: (id: number, course: Partial<Course>) => void
  setSkillGroups: React.Dispatch<React.SetStateAction<SkillGroup[]>>
  setUser: React.Dispatch<React.SetStateAction<User>>
  skillGroups: SkillGroup[]
  user: User
} | null>(null)

export const SessionProvider = ({
  children,
  value,
  ...props
}: React.ProviderProps<{
  courses: Course[]
  user: User
  organization?: UserOrganization
  skillGroups?: SkillGroup[]
}>) => {
  const [courses, setCourses] = useState(value.courses)
  const [user, setUser] = useState(value.user)
  const [organization, setOrganization] = useState(value.organization)
  const [skillGroups, setSkillGroups] = useState(value.skillGroups ?? [])

  const setSessionCourse = useCallback((id: number, course: Partial<Course>) => {
    setCourses(courses => {
      const i = courses.findIndex(course => course.id === id)
      if (i === -1) return [...courses, course as Course]
      const next = [...courses]
      next[i] = { ...next[i], ...course }
      return next
    })
  }, [])

  const addCourse = useCallback(
    async (course: TableInsert<'courses'>) => {
      const data = await createCourse(course)
      setSessionCourse(data.id, data)
      return data
    },
    [setSessionCourse]
  )

  const editSessionCourse = useCallback(
    async (id: number, course: TableUpdate<'courses'>) => {
      const data = await updateCourse(id, course)
      setSessionCourse(data.id, data)
      return data
    },
    [setSessionCourse]
  )

  const removeCourse = useCallback(async (id: number) => {
    await deleteCourse(id)
    setCourses(courses => courses.filter(course => course.id !== id))
  }, [])

  return (
    <SessionContext.Provider
      value={{
        addCourse,
        courses,
        editSessionCourse,
        organization,
        removeCourse,
        setCourses,
        setOrganization,
        setSessionCourse,
        setSkillGroups,
        setUser,
        skillGroups,
        user,
      }}
      {...props}
    >
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used within a SessionProvider')
  return context
}
