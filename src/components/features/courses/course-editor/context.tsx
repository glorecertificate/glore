'use client'

import { createContext, startTransition, use, useMemo, useRef, useState } from 'react'

import { type Locale } from 'next-intl'
import { parseAsInteger, parseAsStringEnum, useQueryState } from 'nuqs'

import {
  deleteAssessment,
  deleteEvaluations,
  deleteQuestionOptions,
  deleteQuestions,
  updateCourse,
  upsertAssessment,
  upsertEvaluations,
  upsertLessons,
  upsertQuestionOptions,
  upsertQuestions,
} from '@/actions/courses/management'
import { COURSE_PARAMS } from '@/components/features/courses/course-editor/params'
import { type Course } from '@/db/queries/course'
import { Lesson, parseLesson } from '@/db/queries/lesson'
import { type TableInsert, type TableUpdate } from '@/db/types'
import { type IntlRecord, LOCALES } from '@/lib/i18n'
import { messages } from '~/config/i18n.json'

interface CourseProviderOptions {
  course: Course
  language: Locale
  step: number
}

interface CourseStatus {
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
export const normalizeContent = (content: unknown): unknown => {
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
  ) {
    return null
  }
  return content
}

const contentStringCache = new WeakMap<object, string>()

const stringifyContent = (content: unknown): string => {
  const normalized = normalizeContent(content)
  if (!normalized) return ''
  if (!Array.isArray(normalized)) return JSON.stringify(normalized)
  const cached = contentStringCache.get(normalized)
  if (cached !== undefined) return cached
  const result = JSON.stringify(normalized)
  contentStringCache.set(normalized, result)
  return result
}

const mergeLocale = <T,>(
  current: Record<string, T> | null | undefined,
  initial: Record<string, T> | null | undefined,
  locale: Locale
): Record<string, T> | null | undefined => {
  if (!current && !initial) return current === null || initial === null ? null : undefined
  if (!initial) return current
  const result: Record<string, T> = { ...initial }
  if (current && locale in current) result[locale] = current[locale]
  return result
}

const ensureLesson = (course: Course): Course => {
  if (course.lessons.length > 0) return course
  const defaultLesson = parseLesson({
    id: Date.now(),
    title: messages.defaultLessonTitle,
    content: LOCALES.reduce((content, locale) => ({ ...content, [locale]: defaultLessonContent }), {} as IntlRecord),
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assessment: null,
    userLessons: [],
    questions: [],
    evaluations: [],
    contributions: [],
  })
  return { ...course, lessons: [defaultLesson] }
}

const useCourseProvider = (options: CourseProviderOptions) => {
  const [language, setLanguage] = useQueryState(
    COURSE_PARAMS.LANGUAGE,
    parseAsStringEnum(LOCALES).withOptions(paramOptions).withDefault(options.language)
  )

  const [step, setStep] = useQueryState(
    COURSE_PARAMS.STEP,
    parseAsInteger.withOptions(paramOptions).withDefault(options.step)
  )
  const [initialCourse] = useState(() => structuredClone(ensureLesson(options.course)))
  const courseRef = useRef(initialCourse)
  const [course, setCourse] = useState(() => ensureLesson(options.course))
  const [saveVersion, setSaveVersion] = useState(0)

  const courseSnapshotRef = useRef(course)
  courseSnapshotRef.current = course
  const contentFlushRef = useRef<(() => void) | null>(null)

  const currentLesson = {
    ...course.lessons[step - 1],
    isFirst: step === 1,
    isLast: step === course.lessons.length,
  }

  // eslint-disable-next-line react-compiler/exhaustive-deps
  const savedCourse = useMemo(() => courseRef.current, [saveVersion])

  const status = useMemo(
    () =>
      LOCALES.reduce(
        (courseState, locale) => {
          const published = !!course.languages?.includes(locale)

          const initialTitle = savedCourse.title[locale]
          const title = course.title[locale]
          const hasTitle = !!title && title.trim().length > 0
          const hasTitleUpdates = hasTitle && initialTitle !== title

          const initialDescription = savedCourse.description?.[locale]
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
            const initialLesson = savedCourse.lessons[i] || {}

            if (lesson.title?.[locale] !== initialLesson.title?.[locale]) return true

            const initialContent = (initialLesson.content as IntlRecord | undefined)?.[locale]
            const currentContent = (lesson.content as IntlRecord | undefined)?.[locale]
            if (stringifyContent(initialContent) !== stringifyContent(currentContent)) return true

            const qs0 = (initialLesson.questions ?? []) as Lesson['questions']
            const qs1 = lesson.questions ?? []
            if (qs0.length !== qs1.length) return true
            if (
              qs1.some((q1, j) => {
                const q0 = qs0[j]
                if (!q0 || q0.id !== q1.id) return true
                if ((q0.description as IntlRecord)?.[locale] !== (q1.description as IntlRecord)?.[locale]) return true
                if ((q0.explanation?.[locale] ?? '') !== ((q1.explanation as IntlRecord | undefined)?.[locale] ?? '')) {
                  return true
                }
                const os0 = q0.options ?? []
                const os1 = q1.options ?? []
                if (os0.length !== os1.length) return true
                return os1.some((o1, k) => {
                  const o0 = os0[k]
                  if (!o0 || o0.id !== o1.id) return true
                  if (((o0.content as IntlRecord)?.[locale] ?? '') !== ((o1.content as IntlRecord)?.[locale] ?? '')) {
                    return true
                  }
                  return !!o0.isCorrect !== !!o1.isCorrect
                })
              })
            ) {
              return true
            }

            const evs0 = (initialLesson.evaluations ?? []) as Array<{ id: number; description: IntlRecord }>
            const evs1 = lesson.evaluations ?? []
            if (evs0.length !== evs1.length) return true
            if (
              evs0.some(
                (e, j) =>
                  e.id !== evs1[j]?.id || e.description?.[locale] !== (evs1[j]?.description as IntlRecord)?.[locale]
              )
            ) {
              return true
            }

            const initialAssessmentDesc = initialLesson.assessment?.description?.[locale]
            const currentAssessmentDesc = (lesson.assessment?.description as IntlRecord | undefined)?.[locale]
            return (
              initialLesson.assessment?.id !== lesson.assessment?.id || initialAssessmentDesc !== currentAssessmentDesc
            )
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
    [course, savedCourse]
  )

  const languageStatus = status[language]

  const hasAnyUpdates = Object.values(status).some(s => s.hasUpdates)

  const editCourse = async (payload: TableUpdate<'courses'>) => {
    setCourse(
      prev =>
        ({
          ...prev,
          ...payload,
          languages: payload.languages ?? prev.languages,
        }) as Course
    )
    const result = await updateCourse(courseSnapshotRef.current.id, payload)
    if (result && !('error' in result)) {
      courseRef.current = { ...courseRef.current, ...payload } as Course
      setSaveVersion(version => version + 1)
    }
    return result
  }

  const saveCourse = async ({ locale, publish }: { locale: Locale; publish?: boolean | null }) => {
    if (contentFlushRef.current) {
      startTransition(() => {
        contentFlushRef.current?.()
      })
    }

    const current = courseSnapshotRef.current
    const initial = courseRef.current
    const { id, lessons } = current

    const lessonsPayload: Array<TableInsert<'lessons'> & { id?: number }> = []
    const idMap = new Map<number, number>()
    const questionIdMap = new Map<number, number>()
    const optionIdMap = new Map<number, number>()
    const initialLessonMap = new Map(initial.lessons.map(l => [l.id, l]))

    for (const [lessonIndex, lesson] of lessons.entries()) {
      const initialLesson = initialLessonMap.get(lesson.id)
      const isNew = !initialLesson
      const lessonUpdates: Record<string, unknown> = {}

      const titleDiffers = isNew || lesson.title?.[locale] !== initialLesson?.title?.[locale]
      if (titleDiffers) {
        lessonUpdates.title = mergeLocale(lesson.title, initialLesson?.title, locale)
      }

      const initialContent = normalizeContent((initialLesson?.content as IntlRecord | undefined)?.[locale])
      const currentContent = normalizeContent((lesson.content as IntlRecord | undefined)?.[locale])
      const contentDiffers = isNew || JSON.stringify(initialContent) !== JSON.stringify(currentContent)
      if (contentDiffers) {
        lessonUpdates.content = mergeLocale(
          lesson.content as IntlRecord | null | undefined,
          initialLesson?.content as IntlRecord | null | undefined,
          locale
        )
      }

      if (isNew || lesson.sortOrder !== initialLesson?.sortOrder) {
        lessonUpdates.sortOrder = lesson.sortOrder ?? lessonIndex + 1
      }

      if (Object.keys(lessonUpdates).length > 0) {
        lessonsPayload.push({
          ...lessonUpdates,
          id: lesson.id,
          title: (lessonUpdates.title ?? lesson.title) as IntlRecord,
          courseId: id,
          sortOrder: (lessonUpdates.sortOrder as number | undefined) ?? lesson.sortOrder ?? lessonIndex + 1,
        } as TableInsert<'lessons'> & { id?: number })
      }
    }

    if (lessonsPayload.length > 0) {
      const result = await upsertLessons(lessonsPayload)
      if (result && 'error' in result) throw result.error
      for (const [i, payload] of lessonsPayload.entries()) {
        const realId = result.data[i]?.id
        if (payload.id && realId && payload.id !== realId) idMap.set(payload.id, realId)
      }
      if (idMap.size > 0) {
        setCourse(prev => ({
          ...prev,
          lessons: prev.lessons.map(l => {
            const newId = idMap.get(l.id!)
            if (newId === undefined) return l
            return { ...l, id: newId }
          }),
        }))
      }
    }

    await Promise.all(
      lessons.map(async lesson => {
        const initialLesson = initialLessonMap.get(lesson.id)
        const initialQuestionMap = new Map((initialLesson?.questions ?? []).map(q => [q.id, q]))
        const initialEvalMap = new Map((initialLesson?.evaluations ?? []).map(e => [e.id, e]))

        const initialQuestionIds = new Set((initialLesson?.questions ?? []).map(q => q.id))
        const currentQuestionIds = new Set(lesson.questions.map(q => q.id))
        const removedQuestionIds = [...initialQuestionIds].filter(qId => !currentQuestionIds.has(qId))

        if (removedQuestionIds.length > 0) {
          const removedOptionIds = (initialLesson?.questions ?? []).reduce<number[]>((ids, q) => {
            if (removedQuestionIds.includes(q.id)) ids.push(...q.options.map(o => o.id))
            return ids
          }, [])
          if (removedOptionIds.length > 0) await deleteQuestionOptions(removedOptionIds)
          await deleteQuestions(removedQuestionIds)
        }

        await Promise.all(
          lesson.questions.map(async q => {
            const existing = initialQuestionMap.get(q.id)
            const questionChanged =
              !existing ||
              existing.description?.[locale] !== (q.description as IntlRecord | undefined)?.[locale] ||
              (existing.explanation?.[locale] ?? null) !== ((q.explanation as IntlRecord | undefined)?.[locale] ?? null)

            let questionId = q.id
            if (!existing) {
              const result = await upsertQuestions([
                {
                  lessonId: lesson.id,
                  description: mergeLocale(q.description as IntlRecord, undefined, locale),
                  explanation: mergeLocale(q.explanation as IntlRecord | null | undefined, null, locale),
                },
              ] as unknown as TableInsert<'questions'>[])
              questionId = result.data[0]?.id ?? q.id
              if (questionId !== q.id) questionIdMap.set(q.id, questionId)
            } else if (questionChanged) {
              await upsertQuestions([
                {
                  id: q.id,
                  lessonId: lesson.id,
                  description: mergeLocale(q.description as IntlRecord, existing.description, locale),
                  explanation: mergeLocale(
                    q.explanation as IntlRecord | null | undefined,
                    existing.explanation ?? null,
                    locale
                  ),
                },
              ] as unknown as TableInsert<'questions'>[])
            }

            const initialOptions = existing?.options ?? []
            const initialOptionMap = new Map(initialOptions.map(o => [o.id, o]))
            const currentOptionIds = new Set(q.options.map(o => o.id))
            const removedOptionIds = initialOptions.reduce<number[]>((ids, o) => {
              if (!currentOptionIds.has(o.id)) ids.push(o.id)
              return ids
            }, [])

            const optionsToUpsert = q.options.reduce<Array<{ tempId?: number; value: Record<string, unknown> }>>(
              (rows, o) => {
                const existingOption = initialOptionMap.get(o.id)
                const changed =
                  !existingOption ||
                  (existingOption.content as IntlRecord | undefined)?.[locale] !==
                    (o.content as IntlRecord | undefined)?.[locale] ||
                  !!existingOption.isCorrect !== !!o.isCorrect
                if (!changed) return rows
                rows.push({
                  tempId: existingOption ? undefined : o.id,
                  value: {
                    id: existingOption ? o.id : undefined,
                    questionId,
                    content: mergeLocale(
                      o.content as IntlRecord,
                      existingOption?.content as IntlRecord | undefined,
                      locale
                    ),
                    isCorrect: !!o.isCorrect,
                  },
                })
                return rows
              },
              []
            )

            if (optionsToUpsert.length > 0) {
              const result = await upsertQuestionOptions(
                optionsToUpsert.map(row => row.value) as unknown as TableInsert<'question_options'>[]
              )
              for (const [i, row] of optionsToUpsert.entries()) {
                const realId = result.data[i]?.id
                if (row.tempId !== undefined && realId !== undefined) optionIdMap.set(row.tempId, realId)
              }
            }
            if (removedOptionIds.length > 0) await deleteQuestionOptions(removedOptionIds)
          })
        )

        const initialEvalIds = new Set((initialLesson?.evaluations ?? []).map(e => e.id))
        const currentEvalIds = new Set(lesson.evaluations.map(e => e.id))
        const removedEvalIds = [...initialEvalIds].filter(eId => !currentEvalIds.has(eId))

        const evalsToUpsert = lesson.evaluations.flatMap(e => {
          const existing = initialEvalMap.get(e.id)
          if (existing && existing.description?.[locale] === (e.description as IntlRecord | undefined)?.[locale]) {
            return []
          }
          return [
            {
              id: existing ? e.id : undefined,
              lessonId: lesson.id,
              description: mergeLocale(e.description as IntlRecord, existing?.description, locale),
            },
          ]
        })

        if (evalsToUpsert.length > 0) await upsertEvaluations(evalsToUpsert as unknown as TableInsert<'evaluations'>[])
        if (removedEvalIds.length > 0) await deleteEvaluations(removedEvalIds)

        const hadAssessment = !!initialLesson?.assessment
        const hasAssessment = !!lesson.assessment

        if (hasAssessment) {
          const initialDesc = initialLesson?.assessment?.description?.[locale]
          const currentDesc = (lesson.assessment?.description as IntlRecord | undefined)?.[locale]
          const descriptionChanged = !hadAssessment || initialDesc !== currentDesc

          if (descriptionChanged && lesson.assessment) {
            await upsertAssessment({
              id: hadAssessment ? lesson.assessment.id : undefined,
              lessonId: lesson.id,
              description: mergeLocale(
                lesson.assessment.description as IntlRecord,
                initialLesson?.assessment?.description,
                locale
              ),
            } as TableInsert<'assessments'>)
          }
        } else if (hadAssessment && initialLesson?.assessment) {
          await deleteAssessment(initialLesson.assessment.id)
        }
      })
    )

    if (questionIdMap.size > 0 || optionIdMap.size > 0) {
      setCourse(prev => ({
        ...prev,
        lessons: prev.lessons.map(l => ({
          ...l,
          questions: l.questions.map(q => ({
            ...q,
            id: questionIdMap.get(q.id) ?? q.id,
            options: q.options.map(o => ({ ...o, id: optionIdMap.get(o.id) ?? o.id })),
          })),
        })),
      }))
    }

    const coursePayload: Record<string, unknown> = {}

    if (current.title?.[locale] !== initial.title?.[locale]) {
      coursePayload.title = mergeLocale(current.title, initial.title, locale)
    }
    if (current.description?.[locale] !== initial.description?.[locale]) {
      coursePayload.description = mergeLocale(current.description, initial.description, locale)
    }

    const nonLocaleKeys = ['icon', 'type', 'slug', 'sortOrder', 'archivedAt'] as const
    for (const key of nonLocaleKeys) {
      if (JSON.stringify(current[key]) !== JSON.stringify(initial[key])) {
        coursePayload[key] = current[key]
      }
    }

    const existingLanguages = (initial.languages ?? []) as Locale[]
    let nextLanguages: Locale[] | undefined
    if (publish === true) {
      nextLanguages = [...new Set([...existingLanguages, locale])]
    }
    if (publish === false) {
      nextLanguages = existingLanguages.filter(l => l !== locale)
    }
    if (nextLanguages !== undefined) {
      coursePayload.languages = nextLanguages
    }

    if (Object.keys(coursePayload).length > 0) {
      await updateCourse(id, {
        ...coursePayload,
        updatedAt: new Date().toISOString(),
      } as TableUpdate<'courses'>)
    }

    if (nextLanguages !== undefined) {
      setCourse(prev => ({ ...prev, languages: nextLanguages }))
    }

    const snapshot = courseSnapshotRef.current
    const remapped =
      idMap.size > 0
        ? {
            ...snapshot,
            lessons: snapshot.lessons.map(l => {
              const newId = idMap.get(l.id!)
              return newId === undefined ? l : { ...l, id: newId }
            }),
          }
        : snapshot

    const mergedLessons = remapped.lessons.map(lesson => {
      const initialLesson = initial.lessons.find(({ id: lessonId }) => lessonId === lesson.id)
      return {
        ...lesson,
        title: mergeLocale(lesson.title, initialLesson?.title, locale) as IntlRecord,
        content: mergeLocale(
          lesson.content as IntlRecord | null | undefined,
          initialLesson?.content as IntlRecord | null | undefined,
          locale
        ),
        questions: lesson.questions.map(q => {
          const existing = initialLesson?.questions.find(iq => iq.id === q.id)
          return {
            ...q,
            id: questionIdMap.get(q.id) ?? q.id,
            description: mergeLocale(q.description as IntlRecord, existing?.description, locale),
            explanation: mergeLocale(q.explanation as IntlRecord | null, existing?.explanation ?? null, locale),
            options: q.options.map(o => {
              const existingOption = existing?.options.find(io => io.id === o.id)
              return {
                ...o,
                id: optionIdMap.get(o.id) ?? o.id,
                content: mergeLocale(
                  o.content as IntlRecord,
                  existingOption?.content as IntlRecord | undefined,
                  locale
                ),
              }
            }),
          }
        }),
        evaluations: lesson.evaluations.map(e => {
          const existing = initialLesson?.evaluations.find(ie => ie.id === e.id)
          return {
            ...e,
            description: mergeLocale(e.description as IntlRecord, existing?.description, locale),
          }
        }),
        assessment: lesson.assessment
          ? {
              ...lesson.assessment,
              description: mergeLocale(
                lesson.assessment.description as IntlRecord,
                initialLesson?.assessment?.description,
                locale
              ),
            }
          : lesson.assessment,
      }
    }) as typeof remapped.lessons

    courseRef.current = structuredClone({
      ...remapped,
      title: mergeLocale(remapped.title, initial.title, locale) as IntlRecord,
      description: mergeLocale(remapped.description, initial.description, locale),
      languages: nextLanguages ?? initial.languages,
      lessons: mergedLessons,
    }) as Course

    setSaveVersion(version => version + 1)
  }

  const addLesson = (values: TableUpdate<'lessons'> = {}) => {
    const lessonData = {
      id: Date.now(),
      title: messages.defaultLessonTitle,
      content: LOCALES.reduce((content, locale) => ({ ...content, [locale]: defaultLessonContent }), {} as IntlRecord),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assessment: null,
      userLessons: [],
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
          sortOrder: prev.lessons.length + 1,
        }),
      ]
      return { ...prev, lessons }
    })
    setCourse(prev => {
      setStep(prev.lessons.length)
      return prev
    })
    return parseLesson({ ...lessonData, sortOrder: 0 })
  }

  const setLesson = (data: TableUpdate<'lessons'> & { id?: number }) => {
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
  }

  const removeLesson = (lessonId: number) => {
    setCourse(prev => {
      const lessons: Lesson[] = []
      for (const [i, lesson] of prev.lessons.entries()) {
        if (lesson.id !== lessonId) {
          lessons.push({ ...lesson, sortOrder: i + 1 })
        }
      }
      return { ...prev, lessons }
    })
    if (step > 1) {
      setStep(i => i - 1)
    }
  }

  const previous = () => {
    if (step > 1) {
      setStep(i => i - 1)
    }
  }

  const next = () => {
    setCourse(prev => {
      if (step < prev.lessons.length) {
        setStep(i => i + 1)
      }
      return prev
    })
  }

  return {
    addLesson,
    contentFlushRef,
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
  }
}

const CourseContext = createContext<ReturnType<typeof useCourseProvider> | null>(null)

export const CourseProvider = ({ children, value, ...props }: React.ProviderProps<CourseProviderOptions>) => {
  const providerValue = useCourseProvider(value)

  return (
    <CourseContext.Provider value={providerValue} {...props}>
      {children}
    </CourseContext.Provider>
  )
}

export const useCourse = () => {
  const context = use(CourseContext)
  if (!context) throw new Error('useCourse must be used within a CourseProvider')
  return context
}
