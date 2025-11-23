'use client'

import { useCallback } from 'react'

import { RichTextEditor } from '@/components/blocks/rich-text-editor'
import { CourseAssessment } from '@/components/features/courses/course-assessment'
import { CourseEvaluations } from '@/components/features/courses/course-evaluations'
import { CourseQuestions } from '@/components/features/courses/course-questions'
import { useCourse } from '@/hooks/use-course'
import { type Question, type QuestionOption, submitAnswers } from '@/lib/data'
import { cn } from '@/lib/utils'

export const CourseContent = () => {
  const { currentLesson, setCourse, step } = useCourse()

  const onQuestionAnswer = useCallback(
    async (question: Question, option: QuestionOption) => {
      setCourse(({ lessons, ...course }) => ({
        ...course,
        lessons: lessons?.map((lesson, i) =>
          i === step - 1
            ? {
                ...lesson,
                questions: lesson.questions?.map(q =>
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
        await submitAnswers([{ id: question.id }])
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
        lessons: lessons?.map(({ evaluations, ...lesson }, i) =>
          i === step - 1
            ? {
                ...lesson,
                evaluations: evaluations?.map(e => (e.id === id ? { ...e, userRating: rating } : e)),
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

  return (
    <>
      <RichTextEditor variant="fullWidth" />
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
