'use client'

import { createContext, useState } from 'react'

import { type Locale } from 'next-intl'

import { type Course, type Lesson } from '@/lib/data'

export interface SessionCourse extends Omit<Course, 'lessons'> {
  lessons: Partial<Lesson>[]
}

export interface CourseContext {
  course: SessionCourse
  initialCourse: Course
  language: Locale
  setCourse: React.Dispatch<React.SetStateAction<SessionCourse>>
  setInitialCourse: React.Dispatch<React.SetStateAction<Course>>
  setLanguage: (locale: Locale) => void
  setSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>
  setStep: React.Dispatch<React.SetStateAction<number>>
  settingsOpen: boolean
  step: number
}

export const CourseContext = createContext<CourseContext | undefined>(undefined)

export interface CourseProviderProps
  extends React.PropsWithChildren<Pick<CourseContext, 'course' | 'language' | 'step'>> {}

export const CourseProvider = ({ children, ...props }: CourseProviderProps) => {
  const [initialCourse, setInitialCourse] = useState(structuredClone(props.course as Course))
  const [course, setCourse] = useState(props.course)
  const [language, setLanguage] = useState(props.language)
  const [step, setStep] = useState(props.step)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <CourseContext.Provider
      value={{
        course,
        initialCourse,
        language,
        setCourse,
        setInitialCourse,
        setLanguage,
        setSettingsOpen,
        setStep,
        settingsOpen,
        step,
      }}
    >
      {children}
    </CourseContext.Provider>
  )
}
