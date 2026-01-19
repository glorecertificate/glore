'use client'

import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useSearchParams } from 'next/navigation'

import { type Locale } from 'next-intl'
import { parseAsInteger, parseAsStringEnum, useQueryState } from 'nuqs'

import config from '@config/app'
import { upsertLessons } from '@/actions/course'
import { useSession } from '@/components/providers/session-provider'
import { type Course } from '@/db/schema/courses'
import { type Lesson } from '@/db/schema/lessons'
import { type TableInsert, type TableUpdate } from '@/db/types'
import { COURSE_LANGUAGE_PARAM, COURSE_STEP_PARAM } from '@/lib/constants'
import { i18n } from '@/lib/i18n'

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
  currentState: CourseState
  defaultLesson: Partial<Lesson>
  editCourse: (payload: TableUpdate<'courses'>) => Promise<Course>
  language: Locale
  lessons: Lesson[]
  next: () => void
  previous: () => void
  saveCourse: () => Promise<void>
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
  history: 'push',
  shallow: true,
  clearOnDefault: false,
})

export const getLessonType = (lesson: Lesson) => {
  if (lesson.questions && lesson.questions.length > 0) return 'questions'
  if (lesson.evaluations && lesson.evaluations.length > 0) return 'evaluations'
  if (lesson.assessment) return 'assessment'
  return 'reading'
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
  const searchParams = useSearchParams()

  const { editSessionCourse } = useSession()

  const [, setLanguage] = useQueryState(COURSE_LANGUAGE_PARAM, languageParamParser.withDefault(value.language))
  const language = useMemo(() => {
    const param = searchParams.get(COURSE_LANGUAGE_PARAM) as Locale
    if (param && i18n.locales.includes(param)) return param
    return i18n.locales.includes(value.language) ? value.language : i18n.defaultLocale
  }, [searchParams, value.language])

  useEffect(() => {
    setLanguage(language)
  }, [language, setLanguage])

  const [, setStep] = useQueryState(COURSE_STEP_PARAM, stepParamParser.withDefault(value.step))
  const step = useMemo(() => {
    const param = searchParams.get(COURSE_STEP_PARAM)
    if (param) return Number(param)
    return value.step
  }, [searchParams, value.step])

  useEffect(() => {
    setStep(step)
  }, [setStep, step])

  const [initialCourse, setInitialCourse] = useState(structuredClone(value.course))
  const [course, setCourse] = useState(value.course as Course)

  const lessons = useMemo(
    () =>
      course.lessons.map(lesson => ({
        ...lesson,
        type: getLessonType(lesson),
      })),
    [course.lessons]
  )

  const defaultLesson = useMemo(
    () => ({
      title: config.i18n.messages.defaultCourseTitle,
      sort_order: lessons.length + 1,
      content: i18n.placeholder,
      assessment: undefined,
      contributions: [],
      questions: [],
      evaluations: [],
      completed: false,
      type: 'reading',
    }),
    [lessons.length]
  )

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

          const hasContent = lessons.every(
            lesson =>
              lesson.title?.[locale] &&
              lesson.title[locale].trim().length > 0 &&
              lesson.content?.[locale] &&
              lesson.content[locale].trim().length > 0
          )
          const hasContentUpdates = lessons.some((lesson, i) => {
            const initialLesson = initialCourse.lessons[i] || {}
            const initialLessonData = { title: initialLesson.title?.[locale], content: initialLesson.content?.[locale] }
            const lessonData = { title: lesson.title?.[locale], content: lesson.content?.[locale] }
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

  const currentState = useMemo(() => state[language], [language, state])

  const editCourse = useCallback(
    async (payload: TableUpdate<'courses'>) => {
      setCourse(prev => {
        const languages = payload.languages ?? prev.languages ?? []
        return { ...prev, ...payload, languages }
      })
      return await editSessionCourse(course.id, payload)
    },
    [course.id, editSessionCourse]
  )

  const saveCourse = useCallback(async () => {
    const { id, lessons, ...courseData } = course

    const lessonsPayload: TableInsert<'lessons'>[] = []

    for (const lesson of lessons) {
      const attributes = Object.keys(lesson) as Array<keyof Lesson>
      const initialLesson = initialCourse.lessons.find(({ id }) => id === lesson.id)
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
          title: lesson.title ?? defaultLesson.title,
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

      if (JSON.stringify(courseData[key]) !== JSON.stringify(initialCourse[key])) {
        coursePayload[key] = courseData[key] as never
      }
    }

    if (Object.keys(coursePayload).length > 0) {
      await editSessionCourse(id, coursePayload)
    }

    setInitialCourse(course as Course)
  }, [course, defaultLesson.title, editSessionCourse, initialCourse])

  const addLesson = useCallback(
    (values: TableUpdate<'lessons'> = {}) => {
      const lesson: Lesson = {
        ...defaultLesson,
        ...values,
        id: Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setCourse(course => ({
        ...course,
        lessons: [...lessons, lesson],
      }))
      setStep(course.lessons.length + 1)
      return lesson
    },
    [course.lessons.length, defaultLesson, lessons, setStep]
  )

  const setLesson = useCallback(
    (data: TableUpdate<'lessons'>) => {
      if (lessons.length === 0) {
        return addLesson(data)
      }
      setCourse(course => ({
        ...course,
        lessons: lessons.map((lesson, i) => (i === step - 1 ? { ...lesson, ...data } : lesson)),
      }))
    },
    [addLesson, lessons.length, lessons.map, step]
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

  return (
    <CourseContext.Provider
      value={{
        addLesson,
        course,
        currentLesson,
        currentState,
        defaultLesson,
        editCourse,
        language,
        lessons,
        next,
        previous,
        saveCourse,
        setCourse,
        setLanguage,
        setLesson,
        setStep,
        state,
        step,
      }}
      {...props}
    >
      {children}
    </CourseContext.Provider>
  )
}

export const useCourse = () => {
  const context = useContext(CourseContext)
  if (!context) throw new Error('useCourse must be used within a CourseProvider')
  return context
}
