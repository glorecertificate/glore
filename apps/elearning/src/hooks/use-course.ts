'use client'

import { useCallback, useContext, useMemo } from 'react'

import { type Locale } from 'next-intl'

import { CourseContext } from '@/components/features/courses/course-provider'
import { useMetadata } from '@/hooks/use-metadata'
import { type Course, DEFAULT_LESSON, type Lesson, type LessonUpsert, updateCourse, upsertLessons } from '@/lib/data'
import { type IntlRecord, LOCALES } from '@/lib/intl'

export interface CourseLanguageStatus {
  canSave: boolean
  hasContent: boolean
  hasContentUpdates: boolean
  hasTitle: boolean
  hasTitleUpdates: boolean
  hasUpdates: boolean
  isFullfilled: boolean
  published: boolean
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
    title: initialCourse.title[language],
  })

  const currentLesson = useMemo(
    () => ({
      ...course.lessons[step - 1],
      isFirst: step === 1,
      isLast: step === course.lessons.length,
    }),
    [course.lessons, step]
  )

  const state = useMemo(
    () =>
      LOCALES.reduce(
        (courseState, locale) => {
          const published = !!course.languages?.includes(locale)

          const initialTitle = initialCourse.title[locale]
          const title = course.title[locale]
          const hasTitle = !!title && title.trim().length > 0
          const hasTitleUpdates = hasTitle && initialTitle !== title

          const hasContent = course.lessons.every(
            lesson =>
              lesson.title?.[locale] &&
              lesson.title[locale].trim().length > 0 &&
              lesson.content?.[locale] &&
              lesson.content[locale].trim().length > 0
          )
          const hasContentUpdates = course.lessons.some((lesson, i) => {
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
    [course, initialCourse]
  )

  const currentState = useMemo(() => state[language], [language, state])

  const saveCourse = useCallback(async () => {
    const { id, lessons, ...courseData } = course

    const lessonsPayload: LessonUpsert[] = []

    for (const [index, lesson] of lessons.entries()) {
      const initialLesson = initialCourse.lessons[index] || {}
      const lessonUpdates: Partial<Lesson> = {}

      for (const attribute in lesson) {
        const key = attribute as keyof typeof lesson

        if (JSON.stringify(lesson[key]) !== JSON.stringify(initialLesson[key])) {
          lessonUpdates[key] = lesson[key] as never
        }
      }

      if (Object.keys(lessonUpdates).length > 0) {
        lessonsPayload.push({
          ...lessonUpdates,
          id: lesson.id,
          title: lesson.title as IntlRecord,
          course_id: id,
          sort_order: index + 1,
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
  }, [course, initialCourse, setInitialCourse])

  const addLesson = useCallback(() => {
    setCourse(course => ({
      ...course,
      lessons: [...course.lessons, DEFAULT_LESSON],
    }))
  }, [setCourse])

  const setLesson = useCallback(
    (data: Partial<Lesson>) => {
      setCourse(course => ({
        ...course,
        lessons:
          course.lessons.length === 0
            ? [
                {
                  ...DEFAULT_LESSON,
                  ...data,
                },
              ]
            : course.lessons.map((lesson, i) => (i === step - 1 ? { ...lesson, ...data } : lesson)),
      }))
    },
    [setCourse, step]
  )

  const movePrevious = useCallback(() => {
    if (step === 1) return
    setStep(i => i - 1)
  }, [setStep, step])

  const moveNext = useCallback(() => {
    // let currentLesson = lesson
    const index = step - 1
    const isLastLesson = step === course.lessons.length

    if (!isLastLesson) setStep(i => i + 1)
    if (course.progress === 100) return

    setCourse(course => ({
      ...course,
      lessons: course.lessons?.map((s, i) => (i === index ? { ...s, completed: true } : s)),
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
  }, [course, setCourse, setStep, step])

  return {
    addLesson,
    course,
    currentLesson,
    currentState,
    language,
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
