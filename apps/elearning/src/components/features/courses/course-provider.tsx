'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

import type { Locale } from 'next-intl'

import config from '@config/app'
import type { PartialKeys } from '@glore/utils/types'

import type { CourseLanguageStatus, LessonType } from '@/components/features/courses/types'
import { useMetadata } from '@/hooks/use-metadata'
import { updateCourse, upsertLessons } from '@/lib/actions/course'
import type { Course, Lesson } from '@/lib/db/schema'
import type { DatabaseInsert, DatabaseUpdate } from '@/lib/db/types'
import { i18n } from '@/lib/i18n'
import type { SetStateAction } from '@/lib/types'

export type SessionLesson = PartialKeys<Lesson, 'id' | 'created_at' | 'updated_at'> & { type: LessonType }
export type SessionCourse = Omit<Course, 'lessons'> & { lessons: SessionLesson[] }

export const CourseContext = createContext<{
  course: SessionCourse
  initialCourse: Course
  language: Locale
  setCourse: SetStateAction<SessionCourse>
  setInitialCourse: SetStateAction<Course>
  setLanguage: SetStateAction<Locale>
  setSettingsOpen: SetStateAction<boolean>
  setStep: SetStateAction<number>
  settingsOpen: boolean
  step: number
} | null>(null)

export const CourseProvider = ({
  children,
  ...props
}: React.PropsWithChildren<{
  course: Course
  language: Locale
  step: number
}>) => {
  const [initialCourse, setInitialCourse] = useState(structuredClone(props.course))
  const [course, setCourse] = useState(props.course as SessionCourse)
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

const getLessonType = (lesson: SessionLesson): LessonType => {
  if (lesson.questions && lesson.questions.length > 0) return 'questions'
  if (lesson.evaluations && lesson.evaluations.length > 0) return 'evaluations'
  if (lesson.assessment) return 'assessment'
  return 'reading'
}

export const useCourse = () => {
  const context = useContext(CourseContext)
  if (!context) throw new Error('useCourse must be used within a CourseProvider')

  const {
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
  } = context

  useMetadata({
    title: course.title[language],
  })

  const lessons = useMemo(
    () =>
      course.lessons.map(lesson => ({
        ...lesson,
        type: getLessonType(lesson),
      })),
    [course.lessons]
  )

  const defaultLesson = useMemo<SessionLesson>(
    () => ({
      title: config.app.defaultLessonTitle,
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
            } satisfies CourseLanguageStatus,
          }
        },
        {} as Record<Locale, CourseLanguageStatus>
      ),
    [course, initialCourse, lessons]
  )

  const currentState = useMemo(() => state[language], [language, state])

  const saveCourse = useCallback(async () => {
    const { id, lessons, ...courseData } = course

    const lessonsPayload: DatabaseInsert<'lessons'>[] = []

    for (const lesson of lessons) {
      const attributes = Object.keys(lesson) as Array<keyof Lesson>
      const initialLesson = initialCourse.lessons.find(({ id }) => id === lesson.id)
      const lessonUpdates: DatabaseUpdate<'lessons'> = {}

      for (const attribute of attributes) {
        if (!initialLesson || JSON.stringify(lesson[attribute]) !== JSON.stringify(initialLesson[attribute])) {
          lessonUpdates[attribute as keyof DatabaseUpdate<'lessons'>] = lesson[attribute] as never
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
      await updateCourse(id, coursePayload)
    }

    setInitialCourse(course as Course)
  }, [course, defaultLesson, initialCourse, setInitialCourse])

  const addLesson = useCallback(() => {
    setCourse(course => ({
      ...course,
      lessons: [...lessons, defaultLesson],
    }))
  }, [defaultLesson, lessons, setCourse])

  const setLesson = useCallback(
    (data: DatabaseUpdate<'lessons'>) => {
      setCourse(course => ({
        ...course,
        lessons:
          lessons.length === 0
            ? [
                {
                  ...defaultLesson,
                  ...data,
                },
              ]
            : lessons.map((lesson, i) => (i === step - 1 ? { ...lesson, ...data } : lesson)),
      }))
    },
    [defaultLesson, lessons, setCourse, step]
  )

  const movePrevious = useCallback(() => {
    if (step === 1) return
    setStep(i => i - 1)
  }, [setStep, step])

  const moveNext = useCallback(() => {
    // let currentLesson = lesson
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

    // if (currentLesson.id) await completeLesson(currentLesson.id)

    // switch (currentLesson?.type) {
    //   case 'questions': {
    //     const options = currentLesson.questions?.flatMap(q => q.options.filter(o => o.isUserAnswer).map(o => ({ id: o.id })))
    //     if (!options || options.length === 0) return
    //     await submitAnswers(options)
    //     break
    //   }
    //   case 'evaluations': {
    //     if (!currentLesson.evaluations) return
    //     await submitEvaluations(currentLesson.evaluations.map(e => ({ id: e.id, value: e.userRating! })))
    //     break
    //   }
    //   case 'assessment': {
    //     const id = currentLesson.assessment?.id
    //     const value = currentLesson.assessment?.userRating
    //     if (!(id && value)) return
    //     await submitAssessment(id, value)
    //   }
    // }

    setCourse(course)
  }, [course, lessons, setCourse, setStep, step])

  return {
    addLesson,
    course,
    currentLesson,
    currentState,
    defaultLesson,
    language,
    lessons,
    moveNext,
    movePrevious,
    saveCourse,
    setCourse,
    setLanguage,
    setLesson,
    setSettingsOpen,
    setStep,
    settingsOpen,
    state,
    step,
  }
}
