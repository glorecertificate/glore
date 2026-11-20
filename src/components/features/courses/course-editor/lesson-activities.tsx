'use client'

import { useEffect, useRef } from 'react'

import { useTranslations } from 'next-intl'

import { ActivityMenuItem } from '@/components/features/courses/course-editor/activity-menu-item'
import { useCourse } from '@/components/features/courses/course-editor/context'
import { DescriptionCard } from '@/components/features/courses/course-editor/description-card'
import { LevelsCard } from '@/components/features/courses/course-editor/levels-card'
import { QuestionCard } from '@/components/features/courses/course-editor/question-card'
import { LucideIcon } from '@/components/icons/lucide'
import { useSession } from '@/components/providers/session'
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  type Assessment,
  type Evaluation,
  type Lesson,
  type LessonType,
  type QuestionOption,
} from '@/db/queries/lesson'
import { type SkillLevel } from '@/db/queries/skill-level-description'
import { INTL_PLACEHOLDER, type IntlRecord } from '@/lib/i18n'
import { cn, tempId } from '@/lib/utils'

type Question = Lesson['questions'][number]

export const LessonActivities = ({ className }: { className?: string }) => {
  const t = useTranslations('CourseEditor')

  const { course, currentLesson, language, setCourse } = useCourse()
  const isSkill = course.type === 'skill'
  const { user } = useSession()
  const rootRef = useRef<HTMLDivElement>(null)
  const focusRef = useRef<string | null>(null)
  const keepFocusRef = useRef(false)

  const canEdit = user.canEdit && !course.archivedAt
  const lessonId = currentLesson.id

  const applyFocus = () => {
    const selector = focusRef.current
    if (!selector) return
    focusRef.current = null
    rootRef.current?.querySelector<HTMLElement>(selector)?.focus()
  }

  useEffect(() => {
    if (keepFocusRef.current) return
    applyFocus()
  }, [currentLesson.assessment, currentLesson.evaluations, currentLesson.questions])

  const updateLesson = (update: (lesson: Lesson) => Lesson) => {
    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.map(lesson => (lesson.id === lessonId ? update(lesson) : lesson)),
    }))
  }

  const updateQuestion = (questionId: number, update: (question: Question) => Question) => {
    updateLesson(lesson => ({
      ...lesson,
      questions: lesson.questions.map(question => (question.id === questionId ? update(question) : question)),
    }))
  }

  const addQuestion = () => {
    const id = tempId()
    const question = {
      id,
      description: INTL_PLACEHOLDER,
      explanation: null,
      answered: false,
      options: [
        { id: tempId(), content: { [language]: '' }, isCorrect: true, isUserAnswer: false },
        { id: tempId(), content: { [language]: '' }, isCorrect: false, isUserAnswer: false },
      ] as unknown as QuestionOption[],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lessonId,
    } as unknown as Question
    focusRef.current = `[data-question-id="${id}"] [data-question-field]`
    updateLesson(lesson => ({ ...lesson, questions: [...lesson.questions, question] }))
  }

  const addEvaluation = () => {
    const id = tempId()
    const evaluation = { id, description: INTL_PLACEHOLDER } as Evaluation
    focusRef.current = `[data-activity-id="evaluation-${id}"] [data-activity-field]`
    updateLesson(lesson => ({ ...lesson, evaluations: [...lesson.evaluations, evaluation] }))
  }

  const addAssessment = () => {
    const assessment = {
      id: tempId(),
      description: INTL_PLACEHOLDER,
      answered: false,
      userAssessments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lessonId,
    } as Assessment
    focusRef.current = '[data-activity-id="assessment"] [data-activity-field]'
    updateLesson(lesson => ({ ...lesson, assessment }))
  }

  const updateQuestionDescription = (questionId: number, value: string) => {
    updateQuestion(questionId, question => ({
      ...question,
      description: { ...question.description, [language]: value },
    }))
  }

  const updateQuestionExplanation = (questionId: number, value: string) => {
    updateQuestion(questionId, question => ({
      ...question,
      explanation: { ...((question.explanation ?? INTL_PLACEHOLDER) as IntlRecord), [language]: value },
    }))
  }

  const addQuestionOption = (questionId: number, optionId: number) => {
    updateQuestion(questionId, question => {
      const option = {
        id: optionId,
        content: { [language]: '' },
        isCorrect: !question.options.some(item => item.isCorrect),
        isUserAnswer: false,
      } as unknown as QuestionOption
      return { ...question, options: [...question.options, option] }
    })
  }

  const updateOptionContent = (questionId: number, optionId: number, value: string) => {
    updateQuestion(questionId, question => ({
      ...question,
      options: question.options.map(option =>
        option.id === optionId
          ? {
              ...option,
              content: {
                ...((option.content as unknown as IntlRecord) ?? INTL_PLACEHOLDER),
                [language]: value,
              },
            }
          : option
      ),
    }))
  }

  const toggleOptionCorrect = (questionId: number, optionId: number) => {
    updateQuestion(questionId, question => ({
      ...question,
      options: question.options.map(option => ({ ...option, isCorrect: option.id === optionId })),
    }))
  }

  const removeOption = (questionId: number, optionId: number) => {
    updateQuestion(questionId, question => {
      const options = question.options.filter(option => option.id !== optionId)
      if (options.length > 0 && !options.some(option => option.isCorrect)) {
        options[0] = { ...options[0], isCorrect: true }
      }
      return { ...question, options }
    })
  }

  const updateEvaluationDescription = (evaluationId: number, value: string) => {
    updateLesson(lesson => ({
      ...lesson,
      evaluations: lesson.evaluations.map(evaluation =>
        evaluation.id === evaluationId
          ? { ...evaluation, description: { ...evaluation.description, [language]: value } }
          : evaluation
      ),
    }))
  }

  const updateAssessmentDescription = (value: string) => {
    updateLesson(lesson =>
      lesson.assessment
        ? {
            ...lesson,
            assessment: {
              ...lesson.assessment,
              description: { ...lesson.assessment.description, [language]: value } as IntlRecord,
            },
          }
        : lesson
    )
  }

  const updateLevelDescription = (level: SkillLevel, value: string) => {
    updateLesson(lesson => {
      if (!lesson.assessment) return lesson
      const { assessment } = lesson
      const levels = assessment.levelDescriptions ?? []
      const existing = levels.find(item => item.level === level)
      const next = existing
        ? levels.map(item =>
            item.level === level ? { ...item, description: { ...item.description, [language]: value } } : item
          )
        : [
            ...levels,
            {
              assessmentId: assessment.id,
              createdAt: new Date().toISOString(),
              description: { ...INTL_PLACEHOLDER, [language]: value } as IntlRecord,
              id: tempId(),
              level,
              updatedAt: new Date().toISOString(),
            },
          ]
      return { ...lesson, assessment: { ...assessment, levelDescriptions: next } }
    })
  }

  const removeQuestion = (index: number) => {
    const { questions } = currentLesson
    const neighbor = questions[index + 1] ?? questions[index - 1]
    focusRef.current = neighbor ? `[data-question-id="${neighbor.id}"] [data-question-field]` : '[data-add-activity]'
    const questionId = questions[index].id
    updateLesson(lesson => ({ ...lesson, questions: lesson.questions.filter(question => question.id !== questionId) }))
  }

  const removeEvaluation = (index: number) => {
    const { evaluations } = currentLesson
    const neighbor = evaluations[index + 1] ?? evaluations[index - 1]
    focusRef.current = neighbor
      ? `[data-activity-id="evaluation-${neighbor.id}"] [data-activity-field]`
      : '[data-add-activity]'
    const evaluationId = evaluations[index].id
    updateLesson(lesson => ({
      ...lesson,
      evaluations: lesson.evaluations.filter(evaluation => evaluation.id !== evaluationId),
    }))
  }

  const removeAssessment = () => {
    focusRef.current = '[data-add-activity]'
    updateLesson(lesson => ({ ...lesson, assessment: undefined }))
  }

  const onAddActivity = (type: LessonType) => {
    keepFocusRef.current = true
    if (type === 'questions') return addQuestion()
    if (type === 'evaluations') return addEvaluation()
    if (type === 'assessment') return addAssessment()
  }

  if (!canEdit) return null

  return (
    <div className={cn('space-y-6', className)} ref={rootRef}>
      {currentLesson.questions.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-1.5 type-label">
            <LucideIcon name="message-circle-question-mark" className="size-4" />
            {t('questionsTitle')}
          </h2>
          <div className="space-y-4">
            <AnimatedList>
              {currentLesson.questions.map((question, index) => (
                <AnimatedListItem key={question.id} variant="row">
                  <QuestionCard
                    description={(question.description as IntlRecord)?.[language] ?? ''}
                    explanation={question.explanation?.[language] ?? ''}
                    id={question.id}
                    label={`${t('activityQuestion')} ${index + 1}`}
                    language={language}
                    number={index + 1}
                    onAddOption={optionId => addQuestionOption(question.id, optionId)}
                    onDescriptionChange={value => updateQuestionDescription(question.id, value)}
                    onExplanationChange={value => updateQuestionExplanation(question.id, value)}
                    onOptionContentChange={(optionId, value) => updateOptionContent(question.id, optionId, value)}
                    onOptionCorrectToggle={optionId => toggleOptionCorrect(question.id, optionId)}
                    onRemove={() => removeQuestion(index)}
                    onRemoveOption={optionId => removeOption(question.id, optionId)}
                    options={question.options}
                  />
                </AnimatedListItem>
              ))}
            </AnimatedList>
          </div>
          <Button icon="plus" onClick={addQuestion} size="sm" type="button" variant="outline">
            {t('addActivityQuestion')}
          </Button>
        </div>
      )}

      {currentLesson.evaluations.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-1.5 type-label">
            <LucideIcon name="clipboard-list" className="size-4" />
            {t('subskillEvaluationsTitle')}
          </h2>
          <div className="space-y-4">
            <AnimatedList>
              {currentLesson.evaluations.map((evaluation, index) => (
                <AnimatedListItem className="space-y-3" key={evaluation.id} variant="row">
                  <DescriptionCard
                    data-activity-id={`evaluation-${evaluation.id}`}
                    deleteLabel={t('removeEvaluation', { number: index + 1 })}
                    description={(evaluation.description as IntlRecord)?.[language] ?? ''}
                    label={`${t('activityEvaluation')} ${index + 1}`}
                    language={language}
                    onDescriptionChange={value => updateEvaluationDescription(evaluation.id, value)}
                    onRemove={() => removeEvaluation(index)}
                  />
                  {/* <RatingGroup
                    className="pointer-events-none opacity-50"
                    color="brand"
                    disabled
                    id={`evaluation-${evaluation.id}`}
                  /> */}
                </AnimatedListItem>
              ))}
            </AnimatedList>
          </div>
          <Button icon="plus" onClick={addEvaluation} size="sm" type="button" variant="outline">
            {t('addActivityEvaluation')}
          </Button>
        </div>
      )}

      {currentLesson.assessment && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-1.5 type-label">
            <LucideIcon name="star" className="size-4" />
            {t('skillEvaluationTitle')}
          </h2>
          {isSkill ? (
            <LevelsCard
              data-activity-id="assessment"
              deleteLabel={t('removeAssessment')}
              descriptions={Object.fromEntries(
                (currentLesson.assessment.levelDescriptions ?? []).map(item => [
                  item.level,
                  item.description[language] ?? '',
                ])
              )}
              label={t('activityLevels')}
              language={language}
              onChange={updateLevelDescription}
              onRemove={removeAssessment}
            />
          ) : (
            <DescriptionCard
              data-activity-id="assessment"
              deleteLabel={t('removeAssessment')}
              description={(currentLesson.assessment.description as IntlRecord)?.[language] ?? ''}
              label={t('activityDescription')}
              language={language}
              onDescriptionChange={updateAssessmentDescription}
              onRemove={removeAssessment}
            />
          )}
          {/* <RatingGroup
            className="pointer-events-none opacity-50"
            color="brand"
            disabled
            id={`assessment-${currentLesson.assessment.id}`}
          /> */}
        </div>
      )}

      <div className="flex w-full items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button data-add-activity icon="plus" type="button" variant="outline">
              {t('addActivity')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            onCloseAutoFocus={event => {
              if (!keepFocusRef.current) return
              keepFocusRef.current = false
              event.preventDefault()
              applyFocus()
            }}
          >
            <ActivityMenuItem
              hint={t('addActivityQuestionHint')}
              icon="message-circle-question-mark"
              onClick={() => onAddActivity('questions')}
              title={t('addActivityQuestion')}
            />
            <ActivityMenuItem
              hint={t('addActivityEvaluationHint')}
              icon="clipboard-list"
              onClick={() => onAddActivity('evaluations')}
              title={t('addActivityEvaluation')}
            />
            <ActivityMenuItem
              disabled={!!currentLesson.assessment}
              hint={currentLesson.assessment ? t('addActivityAssessmentDone') : t('addActivityAssessmentHint')}
              icon="star"
              onClick={() => onAddActivity('assessment')}
              title={t('addActivityAssessment')}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
