'use client'

import { createContext, type Dispatch, type SetStateAction, useCallback, useContext, useMemo, useState } from 'react'

import { type Locale } from 'next-intl'
import { parseAsInteger, parseAsStringEnum, useQueryState } from 'nuqs'

import config from '@config/i18n'
import { updateCourse, upsertLessons } from '@/actions/course'
import { type Course } from '@/db/schema/courses'
import { type Lesson } from '@/db/schema/lessons'
import { type TableInsert, type TableUpdate } from '@/db/types'
import { COURSE_LANGUAGE_PARAM, COURSE_STEP_PARAM } from '@/lib/constants'
import { type IntlRecord, i18n } from '@/lib/i18n'

export interface CourseState {
  canSave: boolean
  hasContent: boolean
  hasContentUpdates: boolean
  hasTitle: boolean
  hasTitleUpdates: boolean
  hasUpdates: boolean
  isFullfilled: boolean
  published: boolean
}

export const CourseContext = createContext<{
  addLesson: (values?: TableUpdate<'lessons'>) => Lesson
  course: Course
  currentLesson: Lesson
  currentLanguageState: CourseState
  defaultLesson: Partial<Lesson>
  editCourse: (payload: TableUpdate<'courses'>) => Promise<Course>
  initialCourse: Course
  language: Locale
  lessons: Lesson[]
  next: () => void
  previous: () => void
  removeLesson: (lessonId: number) => void
  saveCourse: (options?: { languages?: Locale[] }) => Promise<void>
  setCourse: Dispatch<SetStateAction<Course>>
  setLanguage: Dispatch<SetStateAction<Locale>>
  setLesson: (data: TableUpdate<'lessons'>) => void
  setStep: Dispatch<SetStateAction<number>>
  state: Record<Locale, CourseState>
  step: number
} | null>(null)

const languageParamParser = parseAsStringEnum(i18n.locales).withOptions({
  history: 'push',
  shallow: true,
  clearOnDefault: false,
})

const stepParamParser = parseAsInteger.withOptions({
  history: 'replace',
  shallow: true,
  clearOnDefault: false,
})

export const defaultCourse: Partial<Course> = {
  title: config.messages.defaultCourseTitle,
  icon: 'book-dashed',
}

export const defaultLesson: Partial<Lesson> = {
  title: config.messages.defaultLessonTitle,
  // content: i18n.placeholder,
  type: 'reading',
  questions: [],
  evaluations: [],
  contributions: [],
}

export const CourseProvider = ({
  children,
  value,
  ...props
}: React.ProviderProps<{
  course: Course
  language: Locale
  step: number
}>) => {
  const [language, setLanguage] = useQueryState(COURSE_LANGUAGE_PARAM, languageParamParser.withDefault(value.language))

  const [step, setStep] = useQueryState(COURSE_STEP_PARAM, stepParamParser.withDefault(value.step))

  const [initialCourse, setInitialCourse] = useState(structuredClone(value.course))
  const [course, setCourse] = useState(value.course as Course)

  const lessons = useMemo(() => course.lessons, [course.lessons])

  const currentLesson = useMemo(
    () => ({
      ...lessons[step - 1],
      isFirst: step === 1,
      isLast: step === lessons.length,
    }),
    [lessons, step]
  )

  const state = useMemo(
    () =>
      i18n.locales.reduce(
        (courseState, locale) => {
          const published = !!course.languages?.includes(locale)

          const initialTitle = initialCourse.title[locale]
          const title = course.title[locale]
          const hasTitle = !!title && title.trim().length > 0
          const hasTitleUpdates = hasTitle && initialTitle !== title

          const hasContent = lessons.every(lesson => {
            const content = (lesson.content as IntlRecord)?.[locale]
            const hasText =
              Array.isArray(content) &&
              content.some(block =>
                block.children?.some((child: { text?: string }) => child.text && child.text.trim().length > 0)
              )

            return lesson.title?.[locale] && lesson.title[locale].trim().length > 0 && hasText
          })
          const hasContentUpdates = lessons.some((lesson, i) => {
            const initialLesson = initialCourse.lessons[i] || {}
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
            } satisfies CourseState,
          }
        },
        {} as Record<Locale, CourseState>
      ),
    [course, initialCourse, lessons]
  )

  const currentLanguageState = useMemo(() => state[language], [language, state])

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
        const initialLesson = initialCourse.lessons.find(({ id }) => id === lesson.id)
        const lessonUpdates: TableUpdate<'lessons'> = {}

        for (const attribute of attributes) {
          if (attribute === 'type') continue

          if (!initialLesson || JSON.stringify(lesson[attribute]) !== JSON.stringify(initialLesson[attribute])) {
            lessonUpdates[attribute as keyof TableUpdate<'lessons'>] = lesson[attribute] as never
          }
        }

        if (Object.keys(lessonUpdates).length > 0) {
          lessonsPayload.push({
            ...lessonUpdates,
            id: lesson.id,
            title: lesson.title ?? defaultLesson.title,
            course_id: id,
            sort_order: lesson.sort_order ?? lessons.indexOf(lesson) + 1,
          })
        }
      }

      if (lessonsPayload.length > 0) {
        const { error } = await upsertLessons(lessonsPayload)
        if (error) throw error
      }

      const coursePayload: Partial<Course> = {}

      for (const attribute in courseData) {
        const key = attribute as keyof typeof courseData

        if (JSON.stringify(courseData[key]) !== JSON.stringify(initialCourse[key])) {
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
      setInitialCourse(updatedCourse)
    },
    [course, initialCourse]
  )

  const addLesson = useCallback(
    (values: TableUpdate<'lessons'> = {}) => {
      const lesson = {
        ...defaultLesson,
        ...values,
        id: Date.now(),
        sort_order: lessons.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Lesson

      setCourse(course => ({ ...course, lessons: [...lessons, lesson] }))
      setStep(course.lessons.length + 1)
      return lesson
    },
    [course.lessons.length, lessons, setStep]
  )

  const setLesson = useCallback(
    (data: TableUpdate<'lessons'>) => {
      if (lessons.length === 0) {
        return addLesson(data)
      }
      setCourse(course => ({
        ...course,
        lessons: lessons.map((lesson, i) => {
          if (data.id && lesson.id === data.id) return { ...lesson, ...data }
          if (!data.id && i === step - 1) return { ...lesson, ...data }
          return lesson
        }),
      }))
    },
    [addLesson, lessons, step]
  )

  const removeLesson = useCallback(
    (lessonId: number) => {
      setCourse(course => ({
        ...course,
        lessons: lessons
          .filter(lesson => lesson.id !== lessonId)
          .map((lesson, i) => ({ ...lesson, sort_order: i + 1 })),
      }))
      if (step > 1) {
        setStep(i => i - 1)
      }
    },
    [lessons, setStep, step]
  )

  const previous = useCallback(() => {
    if (step === 1) return
    setStep(i => i - 1)
  }, [setStep, step])

  const next = useCallback(() => {
    const index = step - 1
    const isLastLesson = step === lessons.length

    if (!isLastLesson) setStep(i => i + 1)
    if (course.progress === 100) return

    setCourse(course => ({
      ...course,
      lessons: lessons?.map((s, i) => (i === index ? { ...s, completed: true } : s)),
      progressStatus: isLastLesson ? 'completed' : course.progressStatus,
      completed: isLastLesson,
    }))
  }, [course.progress, lessons.length, lessons?.map, setStep, step])

  const contextValue = useMemo(
    () => ({
      addLesson,
      course,
      currentLesson,
      currentLanguageState,
      defaultLesson,
      editCourse,
      initialCourse,
      language,
      lessons,
      next,
      previous,
      removeLesson,
      saveCourse,
      setCourse,
      setLanguage,
      setLesson,
      setStep,
      state,
      step,
    }),
    [
      addLesson,
      course,
      currentLesson,
      currentLanguageState,
      editCourse,
      initialCourse,
      language,
      lessons,
      next,
      previous,
      removeLesson,
      saveCourse,
      setLanguage,
      setLesson,
      setStep,
      state,
      step,
    ]
  )

  return (
    <CourseContext.Provider value={contextValue} {...props}>
      {children}
    </CourseContext.Provider>
  )
}

export const useCourse = () => {
  const context = useContext(CourseContext)
  if (!context) throw new Error('useCourse must be used within a CourseProvider')
  return context
}
