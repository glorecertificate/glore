'use client'

import { memo, useCallback, useEffect, useMemo, useRef } from 'react'

import { type Value } from 'platejs'

import { submitAnswers } from '@/actions/course'
import { RichTextEditor } from '@/components/blocks/rich-text-editor'
import { RichTextEditorProvider } from '@/components/blocks/rich-text-editor/provider'
import { CourseAssessment } from '@/components/features/courses/editor/assessment'
import { useCourse } from '@/components/features/courses/editor/context'
import { CourseEvaluations } from '@/components/features/courses/editor/evaluations'
import { LessonExtras } from '@/components/features/courses/editor/lesson-extras'
import { CourseQuestions } from '@/components/features/courses/editor/questions'
import { type Question, type QuestionOption } from '@/db/queries/lesson'
import { useSession } from '@/hooks/use-session'
import { type IntlRecord } from '@/lib/i18n'
import { cn, debounce } from '@/lib/utils'

const CourseEditor = memo(
  ({
    initialValue,
    onChange,
    version,
  }: {
    initialValue: Value
    onChange: (value: Value) => void
    version: string
  }) => {
    const onChangeRef = useRef(onChange)

    useEffect(() => {
      onChangeRef.current = onChange
    })

    const debouncedOnChange = useMemo(
      () =>
        debounce((value: Value) => {
          onChangeRef.current(value)
        }, 500),
      []
    )

    useEffect(
      () => () => {
        debouncedOnChange.cancel()
      },
      [debouncedOnChange]
    )

    const handleChange = useCallback(
      (newValue: { value?: Value }) => {
        debouncedOnChange(newValue.value ?? (newValue as unknown as Value))
      },
      [debouncedOnChange]
    )

    return (
      <RichTextEditorProvider onChange={handleChange} value={initialValue} version={version}>
        <RichTextEditor autoFocus variant="fullWidth" />
      </RichTextEditorProvider>
    )
  },
  (prev, next) => prev.version === next.version && prev.onChange === next.onChange
)

export const CourseContent = () => {
  const { course, currentLesson, language, setCourse, setLesson, step } = useCourse()
  const { user } = useSession()

  const canEdit = user.canEdit && !course.archived_at
  const currentLessonRef = useRef(currentLesson)
  currentLessonRef.current = currentLesson

  const onQuestionAnswer = useCallback(
    async (question: Question, option: QuestionOption) => {
      setCourse(({ lessons, ...course }) => ({
        ...course,
        lessons: lessons?.map((lesson, i) =>
          i === step - 1 && lesson.questions
            ? {
                ...lesson,
                questions: lesson.questions.map(q =>
                  q.id === question.id
                    ? {
                        ...q,
                        answered: true,
                        options: q.options.map(o => ({ ...o, isUserAnswer: o.id === option.id })),
                      }
                    : q
                ),
              }
            : lesson
        ),
      }))
      try {
        await submitAnswers([{ id: option.id }])
      } catch (e) {
        console.error(e)
      }
    },
    [step, setCourse]
  )

  const onEvaluation = useCallback(
    (id: number, rating: number) => {
      setCourse(({ lessons, ...course }) => ({
        ...course,
        lessons: lessons?.map((lesson, i) =>
          i === step - 1 && lesson.evaluations
            ? {
                ...lesson,
                evaluations: lesson.evaluations.map(e => (e.id === id ? { ...e, userRating: rating } : e)),
              }
            : lesson
        ),
      }))
    },
    [step, setCourse]
  )

  const onAssessment = useCallback(
    (rating: number) => {
      setCourse(({ lessons, ...course }) => ({
        ...course,
        lessons: lessons?.map((lesson, i) =>
          i === step - 1 && lesson.assessment
            ? { ...lesson, assessment: { ...lesson.assessment, userRating: rating } }
            : lesson
        ),
      }))
    },
    [step, setCourse]
  )

  const onContentChange = useCallback(
    (value: Value) => {
      setLesson({
        content: {
          ...currentLessonRef.current.content,
          [language]: value,
        } as IntlRecord,
      })
    },
    [language, setLesson]
  )

  const initialContent = currentLesson?.content?.[language] || [{ type: 'p', children: [{ text: '' }] }]
  const editorVersion = `${step}-${language}`

  return (
    <>
      <CourseEditor initialValue={initialContent as Value} onChange={onContentChange} version={editorVersion} />
      <LessonExtras className="mt-8" />
      {!canEdit && currentLesson?.type === 'questions' && currentLesson.questions && (
        <CourseQuestions
          className={cn('mt-8 border-t-2 pt-6')}
          completed={currentLesson.completed}
          onComplete={onQuestionAnswer}
          questions={currentLesson.questions}
        />
      )}
      {!canEdit && currentLesson?.type === 'evaluations' && currentLesson.evaluations && (
        <CourseEvaluations
          className={cn('mt-8 border-t-2 pt-6')}
          completed={!!currentLesson.completed}
          evaluations={currentLesson.evaluations}
          onEvaluation={onEvaluation}
        />
      )}
      {!canEdit && currentLesson?.type === 'assessment' && currentLesson.assessment && (
        <CourseAssessment
          assessment={currentLesson.assessment}
          className={cn('mt-8 border-t-2 pt-6')}
          completed={!!currentLesson.completed}
          onValueChange={onAssessment}
        />
      )}
    </>
  )
}
