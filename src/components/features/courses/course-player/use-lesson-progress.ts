'use client'

import { startTransition, useState } from 'react'

import { type Locale } from 'next-intl'

import { answerQuestion } from '@/actions/courses/progress'
import {
  type CompletionIssue,
  type LearnerLesson,
  type LearnerQuestion,
  REFLECTION_MAX_LENGTH,
  REFLECTION_MIN_LENGTH,
} from '@/db/queries/learning'

type Feedback = 'correct' | 'wrong' | null

interface QuestionState {
  attempted: number[]
  correctOptionId: number | null
  explanation: string | null
  feedback: Feedback
  selected: number | null
  solved: boolean
}

const initialQuestion = (question: LearnerQuestion): QuestionState => ({
  attempted: question.attempted,
  correctOptionId: question.correctOptionId,
  explanation: question.explanation,
  feedback: question.solved ? 'correct' : question.attempted.length > 0 ? 'wrong' : null,
  selected: null,
  solved: question.solved,
})

export const useLessonProgress = (lesson: LearnerLesson, language: Locale) => {
  const [questions, setQuestions] = useState(() =>
    Object.fromEntries(lesson.questions.map(q => [q.id, initialQuestion(q)]))
  )
  const [checking, setChecking] = useState<number | null>(null)
  const [ratings, setRatings] = useState(() =>
    Object.fromEntries(lesson.evaluations.flatMap(e => (e.value === null ? [] : [[e.id, e.value]])))
  )
  const [assessmentValue, setAssessmentValue] = useState(lesson.assessment?.value ?? null)
  const [reflection, setReflection] = useState(lesson.assessment?.reflection ?? '')
  const [failed, setFailed] = useState(false)

  const patchQuestion = (id: number, patch: Partial<QuestionState>) =>
    setQuestions(prev => ({ ...prev, [id]: { ...prev[id]!, ...patch } }))

  const select = (questionId: number, optionId: number) => patchQuestion(questionId, { selected: optionId })

  const check = (questionId: number) => {
    const state = questions[questionId]
    if (!state || state.selected === null || state.solved) return
    const optionId = state.selected
    setChecking(questionId)
    setFailed(false)
    startTransition(async () => {
      const result = await answerQuestion({ language, optionId, questionId })
      setChecking(null)
      if ('error' in result) {
        setFailed(true)
        return
      }
      const { correct, correctOptionId, explanation } = result.data
      patchQuestion(questionId, {
        attempted: state.attempted.includes(optionId) ? state.attempted : [...state.attempted, optionId],
        correctOptionId,
        explanation,
        feedback: correct ? 'correct' : 'wrong',
        selected: null,
        solved: correct,
      })
    })
  }

  const rate = (evaluationId: number, value: number) => setRatings(prev => ({ ...prev, [evaluationId]: value }))

  const reflectionLength = reflection.trim().length
  const reflectionValid = reflectionLength >= REFLECTION_MIN_LENGTH && reflectionLength <= REFLECTION_MAX_LENGTH

  const blocker: CompletionIssue | null = (() => {
    if (!lesson.questions.every(({ id }) => questions[id]?.solved)) return 'quiz'
    if (!lesson.evaluations.every(({ id }) => ratings[id])) return 'evaluations'
    if (lesson.assessment && assessmentValue === null) return 'assessment'
    if (lesson.assessment && !reflectionValid) return 'reflection'
    return null
  })()

  const payload = {
    assessment: lesson.assessment && assessmentValue !== null ? { reflection, value: assessmentValue } : undefined,
    ratings: lesson.evaluations.flatMap(({ id }) => (ratings[id] ? [{ evaluationId: id, value: ratings[id] }] : [])),
  }

  return {
    assessmentValue,
    blocker,
    check,
    checking,
    failed,
    payload,
    questions,
    rate,
    ratings,
    reflection,
    reflectionLength,
    select,
    setAssessmentValue,
    setReflection,
  }
}
