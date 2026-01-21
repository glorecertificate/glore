'use client'

import { useCallback, useEffect, useMemo } from 'react'

import { type Value } from 'platejs'

import { submitAnswers } from '@/actions/course'
import { RichTextEditor } from '@/components/blocks/rich-text-editor'
import { RichTextEditorProvider } from '@/components/blocks/rich-text-editor/provider'
import { CourseAssessment } from '@/components/features/courses/course-assessment'
import { CourseEvaluations } from '@/components/features/courses/course-evaluations'
import { useCourse } from '@/components/features/courses/course-provider'
import { CourseQuestions } from '@/components/features/courses/course-questions'
import { type Question, type QuestionOption } from '@/db/schema/lessons'
import { type IntlRecord } from '@/lib/i18n'
import { cn, debounce } from '@/lib/utils'

const CourseEditor = ({ initialValue, onChange }: { initialValue: Value; onChange: (value: Value) => void }) => {
  const debouncedOnChange = useMemo(
    () =>
      debounce((value: Value) => {
        onChange(value)
      }, 500),
    [onChange]
  )

  useEffect(
    () => () => {
      debouncedOnChange.cancel()
    },
    [debouncedOnChange]
  )

  return (
    <RichTextEditorProvider
      onChange={newValue => {
        debouncedOnChange(newValue.value ?? newValue)
      }}
      value={initialValue}
    >
      <RichTextEditor variant="fullWidth" />
    </RichTextEditorProvider>
  )
}

export const CourseContent = () => {
  const { currentLesson, language, setCourse, setLesson, step } = useCourse()

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
          ...currentLesson.content,
          [language]: value,
        } as IntlRecord,
      })
    },
    [currentLesson.content, language, setLesson]
  )

  const initialContent = currentLesson?.content?.[language] || [{ type: 'p', children: [{ text: '' }] }]

  return (
    <>
      <CourseEditor initialValue={initialContent as Value} key={`${step}-${language}`} onChange={onContentChange} />
      {currentLesson?.type === 'questions' && currentLesson.questions && (
        <CourseQuestions
          className={cn('mt-8 border-t-2 pt-6')}
          completed={currentLesson.completed}
          onComplete={onQuestionAnswer}
          questions={currentLesson.questions}
        />
      )}
      {currentLesson?.type === 'evaluations' && currentLesson.evaluations && (
        <CourseEvaluations
          className={cn('mt-8 border-t-2 pt-6')}
          completed={!!currentLesson.completed}
          evaluations={currentLesson.evaluations}
          onEvaluation={onEvaluation}
        />
      )}
      {currentLesson?.type === 'assessment' && currentLesson.assessment && (
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
