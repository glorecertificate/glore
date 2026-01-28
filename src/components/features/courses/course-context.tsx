'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

import { type Locale } from 'next-intl'
import { parseAsInteger, parseAsStringEnum, useQueryState } from 'nuqs'

import { messages } from '~/config/i18n.json'

import { updateCourse, upsertLessons } from '@/actions/course'
import { type Course } from '@/db/queries/course'
import { type Lesson, parseLesson } from '@/db/queries/lesson'
import { type TableInsert, type TableUpdate } from '@/db/types'
import { COURSE_LANGUAGE_PARAM, COURSE_STEP_PARAM } from '@/lib/constants'
import { type IntlRecord, i18n } from '@/lib/i18n'

interface CourseProviderOptions {
  course: Course
  language: Locale
  step: number
}

export interface CourseStatus {
  canSave: boolean
  hasContent: boolean
  hasContentUpdates: boolean
  hasTitle: boolean
  hasTitleUpdates: boolean
  hasUpdates: boolean
  isFullfilled: boolean
  published: boolean
}

const paramOptions = {
  clearOnDefault: false,
  history: 'push',
  shallow: true,
} as const

const defaultLessonContent = {}

const useCourseProvider = (options: CourseProviderOptions) => {
  const [language, setLanguage] = useQueryState(
    COURSE_LANGUAGE_PARAM,
    parseAsStringEnum(i18n.locales).withOptions(paramOptions).withDefault(options.language)
  )

  const [step, setStep] = useQueryState(
    COURSE_STEP_PARAM,
    parseAsInteger.withOptions(paramOptions).withDefault(options.step)
  )

  const courseRef = useRef(structuredClone(options.course))
  const [course, setCourse] = useState(options.course)

  const currentLesson = useMemo(
    () => ({
      ...course.lessons[step - 1],
      isFirst: step === 1,
      isLast: step === course.lessons.length,
    }),
    [course.lessons, step]
  )

  const status = useMemo(
    () =>
      i18n.locales.reduce(
        (courseState, locale) => {
          const published = !!course.languages?.includes(locale)

          const initialTitle = courseRef.current.title[locale]
          const title = course.title[locale]
          const hasTitle = !!title && title.trim().length > 0
          const hasTitleUpdates = hasTitle && initialTitle !== title

          const hasContent = course.lessons.every(lesson => {
            const content = (lesson.content as IntlRecord)?.[locale]
            const hasText =
              Array.isArray(content) &&
              content.some(block =>
                block.children?.some((child: { text?: string }) => child.text && child.text.trim().length > 0)
              )

            return lesson.title?.[locale] && lesson.title[locale].trim().length > 0 && hasText
          })
          const hasContentUpdates = course.lessons.some((lesson, i) => {
            const initialLesson = courseRef.current.lessons[i] || {}
            const initialLessonData = {
              title: initialLesson.title?.[locale],
              content: (initialLesson.content as IntlRecord)?.[locale],
            }
            const lessonData = {
              title: lesson.title?.[locale],
              content: (lesson.content as IntlRecord)?.[locale],
            }
            return JSON.stringify(initialLessonData) !== JSON.stringify(lessonData)
          })

          const hasUpdates = hasTitleUpdates || hasContentUpdates
          const isFullfilled = hasTitle && hasContent
          const canSave = published ? isFullfilled && hasUpdates : hasTitle && hasUpdates

          return {
            ...courseState,
            [locale]: {
              published,
              hasTitle,
              hasTitleUpdates,
              hasContent,
              hasContentUpdates,
              hasUpdates,
              isFullfilled,
              canSave,
            } satisfies CourseStatus,
          }
        },
        {} as Record<Locale, CourseStatus>
      ),
    [course.languages, course.lessons, course.title]
  )

  const languageStatus = useMemo(() => status[language], [status, language])

  const editCourse = useCallback(
    async (payload: TableUpdate<'courses'>) => {
      setCourse(prev => {
        const languages = payload.languages ?? prev.languages ?? []
        return { ...prev, ...payload, languages }
      })
      return await updateCourse(course.id, payload)
    },
    [course.id]
  )

  const saveCourse = useCallback(
    async ({ languages }: { languages?: Locale[] } = {}) => {
      const { id, lessons, ...courseData } = course
      let updatedCourse = course

      const lessonsPayload: TableInsert<'lessons'>[] = []

      for (const lesson of lessons) {
        const attributes = Object.keys(lesson) as Array<keyof Lesson>
        const initialLesson = courseRef.current.lessons.find(({ id }) => id === lesson.id)
        const lessonUpdates: TableUpdate<'lessons'> = {}

        for (const attribute of attributes) {
          if (!initialLesson || JSON.stringify(lesson[attribute]) !== JSON.stringify(initialLesson[attribute])) {
            lessonUpdates[attribute as keyof TableUpdate<'lessons'>] = lesson[attribute] as never
          }
        }

        if (Object.keys(lessonUpdates).length > 0) {
          lessonsPayload.push({
            ...lessonUpdates,
            id: lesson.id,
            title: lesson.title,
            course_id: id,
            sort_order: lesson.sort_order ?? lessons.indexOf(lesson) + 1,
          })
        }
      }

      if (lessonsPayload.length > 0) {
        await upsertLessons(lessonsPayload)
      }

      const coursePayload: Partial<Course> = {}

      for (const attribute in courseData) {
        const key = attribute as keyof typeof courseData

        if (JSON.stringify(courseData[key]) !== JSON.stringify(courseRef.current[key])) {
          coursePayload[key] = courseData[key] as never
        }
      }

      if (languages) {
        const newLanguages = Array.from(new Set([...(course.languages ?? []), ...languages]))
        coursePayload.languages = newLanguages
        updatedCourse = { ...course, languages: newLanguages }
      }

      if (Object.keys(coursePayload).length > 0) {
        await updateCourse(id, coursePayload)
      }

      setCourse(updatedCourse)
      courseRef.current = structuredClone(updatedCourse)
    },
    [course]
  )

  const addLesson = useCallback(
    (values: TableUpdate<'lessons'> = {}) => {
      const lesson = {
        id: Date.now(),
        title: messages.defaultLessonTitle,
        content: i18n.locales.reduce(
          (content, locale) => ({ ...content, [locale]: defaultLessonContent }),
          {} as IntlRecord
        ),
        sort_order: course.lessons.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assessment: null,
        user_lessons: [],
        questions: [],
        evaluations: [],
        contributions: [],
        ...values,
      }
      setCourse(({ lessons, ...course }) => ({
        ...course,
        lessons: [
          ...lessons,
          parseLesson({
            id: Date.now(),
            title: messages.defaultLessonTitle,
            content: i18n.locales.reduce(
              (content, locale) => ({ ...content, [locale]: defaultLessonContent }),
              {} as IntlRecord
            ),
            sort_order: lessons.length + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            assessment: null,
            user_lessons: [],
            questions: [],
            evaluations: [],
            contributions: [],
            ...values,
          }),
        ],
      }))
      setStep(course.lessons.length + 1)
      return lesson
    },
    [course.lessons, setStep]
  )

  const setLesson = useCallback(
    (data: TableUpdate<'lessons'>) => {
      if (course.lessons.length === 0) {
        addLesson(data)
        return
      }
      setCourse(({ lessons, ...course }) => ({
        ...course,
        lessons: lessons.map((lesson, i) => {
          if (data.id && lesson.id === data.id) return { ...lesson, ...data }
          if (!data.id && i === step - 1) return { ...lesson, ...data }
          return lesson
        }),
      }))
    },
    [addLesson, course.lessons, step]
  )

  const removeLesson = useCallback(
    (lessonId: number) => {
      setCourse(course => ({
        ...course,
        lessons: course.lessons
          .filter(lesson => lesson.id !== lessonId)
          .map((lesson, i) => ({ ...lesson, sort_order: i + 1 })),
      }))
      if (step > 1) {
        setStep(i => i - 1)
      }
    },
    [setStep, step]
  )

  const previous = useCallback(() => {
    if (step > 1) {
      setStep(i => i - 1)
    }
  }, [setStep, step])

  const next = useCallback(() => {
    if (step < course.lessons.length) {
      setStep(i => i + 1)
    }
  }, [course.lessons, setStep, step])

  return useMemo(
    () => ({
      addLesson,
      course,
      courseRef,
      currentLesson,
      editCourse,
      language,
      languageStatus,
      next,
      previous,
      removeLesson,
      saveCourse,
      setCourse,
      setLanguage,
      setLesson,
      setStep,
      status,
      step,
    }),
    [
      addLesson,
      course,
      currentLesson,
      editCourse,
      language,
      languageStatus,
      next,
      previous,
      removeLesson,
      saveCourse,
      setLanguage,
      setLesson,
      setStep,
      status,
      step,
    ]
  )
}

export const CourseContext = createContext<ReturnType<typeof useCourseProvider> | null>(null)

export const CourseProvider = ({ children, value, ...props }: React.ProviderProps<CourseProviderOptions>) => {
  const providerValue = useCourseProvider(value)

  return (
    <CourseContext.Provider value={providerValue} {...props}>
      {children}
    </CourseContext.Provider>
  )
}

export const useCourse = () => {
  const context = useContext(CourseContext)
  if (!context) throw new Error('useCourse must be used within a CourseProvider')
  return context
}
