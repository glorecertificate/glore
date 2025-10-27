'use client'

import { createContext, useContext } from 'react'

import { type Locale } from 'next-intl'

import { type AnyFunction, type Enum } from '@glore/utils/types'

import { type Course, type CourseProgress, type Lesson } from '@/lib/data'
import { type LocaleItem } from '@/lib/intl'
import { type CourseMode } from '@/lib/navigation'

export interface CourseContext {
  course: Partial<Course>
  infoVisible: boolean
  initialCourse: Partial<Course>
  language: LocaleItem
  lesson: Lesson
  mode?: Enum<CourseMode>
  moveNext: AnyFunction
  movePrevious: AnyFunction
  setCourse: React.Dispatch<React.SetStateAction<Partial<Course>>>
  setInfoVisible: React.Dispatch<React.SetStateAction<boolean>>
  setLanguage: (locale: Locale) => void
  setMode: (mode: Enum<CourseMode>) => void
  setStep: React.Dispatch<React.SetStateAction<number>>
  status?: Enum<CourseProgress>
  step: number
}

const CourseContext = createContext<CourseContext | undefined>(undefined)

export const CourseProvider = CourseContext.Provider

/**
 * Helper function to create course provider value with immutable initial course.
 * This ensures the initial course is deeply cloned to prevent mutations.
 *
 * @param course - The initial course data
 * @param props - Other course context properties
 * @returns Course context value with immutable initial course
 */
export const createCourseProviderValue = (
  course: Partial<Course>,
  props: Omit<CourseContext, 'initialCourse'>
): CourseContext => ({
  initialCourse: structuredClone(course),
  ...props,
})

export const useCourse = () => {
  const context = useContext(CourseContext)
  if (!context) throw new Error('useCourse must be used within a CourseProvider')
  return context
}
