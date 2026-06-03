'use client'

import { createContext, use, useState } from 'react'

import { type Locale } from 'next-intl'

import { useCookies } from '@/hooks/use-cookies'

type CourseLanguages = Record<number, Locale>

interface CourseLanguagesContextValue {
  languages: CourseLanguages
  setLanguage: (courseId: number, language: Locale) => void
}

const CourseLanguagesContext = createContext<CourseLanguagesContextValue | null>(null)

export const CourseLanguagesProvider = ({ children }: React.PropsWithChildren) => {
  const cookies = useCookies()
  const [languages, setLanguages] = useState<CourseLanguages>(() => cookies.get('courseListLanguages') ?? {})

  const setLanguage = (courseId: number, language: Locale) => {
    setLanguages(prev => {
      if (prev[courseId] === language) return prev
      const next = { ...prev, [courseId]: language }
      cookies.set('courseListLanguages', next)
      return next
    })
  }

  return (
    <CourseLanguagesContext.Provider value={{ languages, setLanguage }}>{children}</CourseLanguagesContext.Provider>
  )
}

export const useCourseLanguages = () => {
  const context = use(CourseLanguagesContext)
  if (!context) throw new Error('useCourseLanguages must be used within a CourseLanguagesProvider')
  return context
}

export const resolveCourseLanguage = (
  languages: CourseLanguages,
  courseId: number,
  { activeLanguages, fallback }: { activeLanguages: Locale[]; fallback: Locale }
): Locale => {
  const stored = languages[courseId]
  if (stored && activeLanguages.includes(stored)) return stored
  if (activeLanguages.includes(fallback)) return fallback
  return activeLanguages[0] ?? fallback
}
