'use client'

import { createContext, memo, useCallback, useContext, useMemo, useRef, useState } from 'react'

import { type Locale } from 'next-intl'
import { parseAsInteger, parseAsStringEnum, useQueryState } from 'nuqs'

import { messages } from '~/config/i18n.json'

import {
  deleteAssessment,
  deleteEvaluations,
  deleteQuestions,
  updateCourse,
  upsertAssessment,
  upsertEvaluations,
  upsertLessons,
  upsertQuestions,
} from '@/actions/course'
import { COURSE_PARAMS } from '@/components/features/courses/editor/params'
import { type Course } from '@/db/queries/course'
import { type Lesson, parseLesson } from '@/db/queries/lesson'
import { type TableInsert, type TableUpdate } from '@/db/types'
import { type IntlRecord, i18n } from '@/lib/i18n'

interface CourseProviderOptions {
  course: Course
  language: Locale
  step: number
}

export interface CourseStatus {
  hasContent: boolean
  hasContentUpdates: boolean
  hasDescriptionUpdates: boolean
  hasTitle: boolean
  hasTitleUpdates: boolean
  hasUpdates: boolean
  isFulfilled: boolean
  published: boolean
}

const paramOptions = {
  clearOnDefault: false,
  history: 'push',
  shallow: true,
} as const

const defaultLessonContent = [{ type: 'p', children: [{ text: '' }] }]

/** Treats null, undefined, empty string, empty array, and a single empty paragraph as equivalent (null). */
const normalizeContent = (content: unknown): unknown => {
  if (!content) return null
  if (typeof content === 'string' && content.trim() === '') return null
  if (Array.isArray(content) && content.length === 0) return null
  if (
    Array.isArray(content) &&
    content.length === 1 &&
    (content[0].type === 'p' || content[0].type === 'paragraph') &&
    Array.isArray(content[0].children) &&
    content[0].children.length === 1 &&
    content[0].children[0].text === ''
  )
    return null
  return content
}

const ensureLesson = (course: Course): Course => {
  if (course.lessons.length > 0) return course
  const defaultLesson = parseLesson({
    id: Date.now(),
    title: messages.defaultLessonTitle,
    content: i18n.locales.reduce(
      (content, locale) => ({ ...content, [locale]: defaultLessonContent }),
      {} as IntlRecord
    ),
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assessment: null,
    user_lessons: [],
    questions: [],
    evaluations: [],
    contributions: [],
  })
  return { ...course, lessons: [defaultLesson] }
}

const useCourseProvider = (options: CourseProviderOptions) => {
  const [language, setLanguage] = useQueryState(
    COURSE_PARAMS.LANGUAGE,
    parseAsStringEnum(i18n.locales).withOptions(paramOptions).withDefault(options.language)
  )

  const [step, setStep] = useQueryState(
    COURSE_PARAMS.STEP,
    parseAsInteger.withOptions(paramOptions).withDefault(options.step)
  )

  const courseRef = useRef(structuredClone(ensureLesson(options.course)))
  const [course, setCourse] = useState(() => ensureLesson(options.course))

  // Stable ref to current course for callbacks that shouldn't re-create on every edit
  const courseSnapshotRef = useRef(course)
  courseSnapshotRef.current = course

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

          const initialDescription = courseRef.current.description?.[locale]
          const currentDescription = course.description?.[locale]
          const hasDescriptionUpdates = currentDescription !== initialDescription

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
              content: normalizeContent((initialLesson.content as IntlRecord)?.[locale]),
            }
            const lessonData = {
              title: lesson.title?.[locale],
              content: normalizeContent((lesson.content as IntlRecord)?.[locale]),
            }
            if (JSON.stringify(initialLessonData) !== JSON.stringify(lessonData)) return true

            const initialQuestions = (initialLesson.questions ?? []).map(
              (q: { id: number; description: IntlRecord }) => ({ id: q.id, description: q.description?.[locale] })
            )
            const currentQuestions = (lesson.questions ?? []).map(q => ({
              id: q.id,
              description: (q.description as IntlRecord)?.[locale],
            }))
            if (JSON.stringify(initialQuestions) !== JSON.stringify(currentQuestions)) return true

            const initialEvaluations = (initialLesson.evaluations ?? []).map(
              (e: { id: number; description: IntlRecord }) => ({ id: e.id, description: e.description?.[locale] })
            )
            const currentEvaluations = (lesson.evaluations ?? []).map(e => ({
              id: e.id,
              description: (e.description as IntlRecord)?.[locale],
            }))
            if (JSON.stringify(initialEvaluations) !== JSON.stringify(currentEvaluations)) return true

            const initialAssessmentDesc = initialLesson.assessment?.description?.[locale]
            const currentAssessmentDesc = (lesson.assessment?.description as IntlRecord)?.[locale]
            if (
              JSON.stringify({ id: initialLesson.assessment?.id, d: initialAssessmentDesc }) !==
              JSON.stringify({ id: lesson.assessment?.id, d: currentAssessmentDesc })
            )
              return true

            return false
          })

          const hasUpdates = hasTitleUpdates || hasContentUpdates || hasDescriptionUpdates
          const isFulfilled = hasTitle && hasContent

          return {
            ...courseState,
            [locale]: {
              published,
              hasTitle,
              hasTitleUpdates,
              hasContent,
              hasContentUpdates,
              hasDescriptionUpdates,
              hasUpdates,
              isFulfilled,
            } satisfies CourseStatus,
          }
        },
        {} as Record<Locale, CourseStatus>
      ),
    [course.description, course.languages, course.lessons, course.title]
  )

  const languageStatus = useMemo(() => status[language], [status, language])

  const hasAnyUpdates = useMemo(() => Object.values(status).some(s => s.hasUpdates), [status])

  const editCourse = useCallback(async (payload: TableUpdate<'courses'>) => {
    setCourse(prev => ({
      ...prev,
      ...payload,
      languages: payload.languages ?? prev.languages,
    }))
    const result = await updateCourse(courseSnapshotRef.current.id, payload)
    if (result && !('error' in result)) {
      courseRef.current = { ...courseRef.current, ...payload } as Course
    }
    return result
  }, [])

  const saveCourse = useCallback(
    async ({ languages }: { languages?: Locale[] } = {}) => {
      const current = courseSnapshotRef.current
      const { id, lessons, ...courseData } = current
      let updatedCourse = current

      const lessonsPayload: TableInsert<'lessons'>[] = []
      const lessonOnlyKeys = new Set([
        'title',
        'content',
        'sort_order',
        'course_id',
        'id',
        'created_at',
        'updated_at',
        'deleted_at',
      ])

      for (const lesson of lessons) {
        const attributes = Object.keys(lesson) as Array<keyof Lesson>
        const initialLesson = courseRef.current.lessons.find(({ id }) => id === lesson.id)
        const lessonUpdates: TableUpdate<'lessons'> = {}

        for (const attribute of attributes) {
          if (!lessonOnlyKeys.has(attribute)) continue
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

      for (const lesson of lessons) {
        const initialLesson = courseRef.current.lessons.find(({ id }) => id === lesson.id)

        const initialQuestionIds = new Set((initialLesson?.questions ?? []).map(q => q.id))
        const currentQuestionIds = new Set(lesson.questions.map(q => q.id))
        const removedQuestionIds = [...initialQuestionIds].filter(qId => !currentQuestionIds.has(qId))

        const questionsToUpsert = lesson.questions
          .filter(q => {
            if (!initialQuestionIds.has(q.id)) return true
            const initial = initialLesson?.questions.find(iq => iq.id === q.id)
            return !initial || JSON.stringify(initial.description) !== JSON.stringify(q.description)
          })
          .map(q => ({
            id: initialQuestionIds.has(q.id) ? q.id : undefined,
            lesson_id: lesson.id,
            description: q.description as IntlRecord,
            explanation: q.explanation as IntlRecord | null,
          }))

        if (questionsToUpsert.length > 0) await upsertQuestions(questionsToUpsert as TableInsert<'questions'>[])
        if (removedQuestionIds.length > 0) await deleteQuestions(removedQuestionIds)

        const initialEvalIds = new Set((initialLesson?.evaluations ?? []).map(e => e.id))
        const currentEvalIds = new Set(lesson.evaluations.map(e => e.id))
        const removedEvalIds = [...initialEvalIds].filter(eId => !currentEvalIds.has(eId))

        const evalsToUpsert = lesson.evaluations
          .filter(e => {
            if (!initialEvalIds.has(e.id)) return true
            const initial = initialLesson?.evaluations.find(ie => ie.id === e.id)
            return !initial || JSON.stringify(initial.description) !== JSON.stringify(e.description)
          })
          .map(e => ({
            id: initialEvalIds.has(e.id) ? e.id : undefined,
            lesson_id: lesson.id,
            description: e.description as IntlRecord,
          }))

        if (evalsToUpsert.length > 0) await upsertEvaluations(evalsToUpsert as TableInsert<'evaluations'>[])
        if (removedEvalIds.length > 0) await deleteEvaluations(removedEvalIds)

        const hadAssessment = !!initialLesson?.assessment
        const hasAssessment = !!lesson.assessment

        if (hasAssessment) {
          const descriptionChanged =
            !hadAssessment ||
            JSON.stringify(initialLesson?.assessment?.description) !== JSON.stringify(lesson.assessment?.description)

          if (descriptionChanged && lesson.assessment) {
            await upsertAssessment({
              id: hadAssessment ? lesson.assessment.id : undefined,
              lesson_id: lesson.id,
              description: lesson.assessment.description as IntlRecord,
            } as TableInsert<'assessments'>)
          }
        } else if (hadAssessment && initialLesson?.assessment) {
          await deleteAssessment(initialLesson.assessment.id)
        }
      }

      const coursePayload: Partial<Course> = {}

      for (const attribute in courseData) {
        const key = attribute as keyof typeof courseData

        if (JSON.stringify(courseData[key]) !== JSON.stringify(courseRef.current[key])) {
          coursePayload[key] = courseData[key] as never
        }
      }

      if (languages) {
        coursePayload.languages = languages
        updatedCourse = { ...current, languages }
      }

      if (Object.keys(coursePayload).length > 0) {
        await updateCourse(id, coursePayload)
      }

      setCourse(updatedCourse)
      courseRef.current = structuredClone(updatedCourse)
    },
    [] // Stable — reads from refs
  )

  const addLesson = useCallback(
    (values: TableUpdate<'lessons'> = {}) => {
      const lessonData = {
        id: Date.now(),
        title: messages.defaultLessonTitle,
        content: i18n.locales.reduce(
          (content, locale) => ({ ...content, [locale]: defaultLessonContent }),
          {} as IntlRecord
        ),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assessment: null,
        user_lessons: [],
        questions: [],
        evaluations: [],
        contributions: [],
        ...values,
      }
      setCourse(prev => {
        const lessons = [
          ...prev.lessons,
          parseLesson({
            ...lessonData,
            sort_order: prev.lessons.length + 1,
          }),
        ]
        return { ...prev, lessons }
      })
      setCourse(prev => {
        setStep(prev.lessons.length)
        return prev
      })
      return parseLesson({ ...lessonData, sort_order: 0 })
    },
    [setStep]
  )

  const setLesson = useCallback(
    (data: TableUpdate<'lessons'>) => {
      setCourse(prev => {
        if (prev.lessons.length === 0) {
          addLesson(data)
          return prev
        }
        return {
          ...prev,
          lessons: prev.lessons.map((lesson, i) => {
            if (data.id && lesson.id === data.id) return { ...lesson, ...data }
            if (!data.id && i === step - 1) return { ...lesson, ...data }
            return lesson
          }),
        }
      })
    },
    [addLesson, step]
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
    setCourse(prev => {
      if (step < prev.lessons.length) {
        setStep(i => i + 1)
      }
      return prev
    })
  }, [setStep, step])

  return useMemo(
    () => ({
      addLesson,
      course,
      courseRef,
      currentLesson,
      editCourse,
      hasAnyUpdates,
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
      hasAnyUpdates,
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

export const CourseProvider = memo(({ children, value, ...props }: React.ProviderProps<CourseProviderOptions>) => {
  const providerValue = useCourseProvider(value)

  return (
    <CourseContext.Provider value={providerValue} {...props}>
      {children}
    </CourseContext.Provider>
  )
})

export const useCourse = () => {
  const context = useContext(CourseContext)
  if (!context) throw new Error('useCourse must be used within a CourseProvider')
  return context
}
