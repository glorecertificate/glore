'use client'

import { memo, useCallback } from 'react'

import { CheckIcon, ClipboardListIcon, MessageCircleQuestionIcon, PlusIcon, StarIcon, TrashIcon } from 'lucide-react'
import { type Locale, useTranslations } from 'next-intl'

import { useCourse } from '@/components/features/courses/editor/context'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { type Assessment, type Evaluation, type LessonType, type QuestionOption } from '@/db/queries/lesson'
import { type Course } from '@/db/queries/course'
import { useSession } from '@/hooks/use-session'
import { type IntlRecord, intlPlaceholder } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const ExtraItem = memo(
  ({
    description,
    label,
    language,
    onDescriptionChange,
    onRemove,
  }: {
    description: string
    label: string
    language: Locale
    onDescriptionChange: (value: string) => void
    onRemove: () => void
  }) => {
    const tLang = useTranslations('Intl.Languages')
    const t = useTranslations('Courses')

    return (
      <div className="group flex items-start gap-2">
        <div className="flex-1 space-y-1">
          <p className="font-medium text-muted-foreground text-xs">{label}</p>
          <Textarea
            className="min-h-10 text-sm"
            onChange={e => onDescriptionChange(e.target.value)}
            placeholder={t('extraDescriptionPlaceholder', { lang: tLang(language).toLowerCase() })}
            value={description}
          />
        </div>
        <Button
          className="mt-5 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={onRemove}
          size="icon"
          variant="ghost"
        >
          <TrashIcon className="size-4 text-destructive" />
        </Button>
      </div>
    )
  }
)

const QuestionItem = memo(
  ({
    description,
    explanation,
    label,
    language,
    onAddOption,
    onDescriptionChange,
    onExplanationChange,
    onOptionContentChange,
    onOptionCorrectToggle,
    onRemove,
    onRemoveOption,
    options,
  }: {
    description: string
    explanation: string
    label: string
    language: Locale
    onAddOption: () => void
    onDescriptionChange: (value: string) => void
    onExplanationChange: (value: string) => void
    onOptionContentChange: (optionId: number, value: string) => void
    onOptionCorrectToggle: (optionId: number) => void
    onRemove: () => void
    onRemoveOption: (optionId: number) => void
    options: QuestionOption[]
  }) => {
    const tLang = useTranslations('Intl.Languages')
    const t = useTranslations('Courses')

    return (
      <div className="group/question space-y-3 rounded-lg border p-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 space-y-1">
            <p className="font-medium text-muted-foreground text-xs">{label}</p>
            <Textarea
              className="min-h-10 text-sm"
              onChange={e => onDescriptionChange(e.target.value)}
              placeholder={t('extraDescriptionPlaceholder', { lang: tLang(language).toLowerCase() })}
              value={description}
            />
          </div>
          <Button
            className="mt-5 opacity-0 transition-opacity group-hover/question:opacity-100"
            onClick={onRemove}
            size="icon"
            variant="ghost"
          >
            <TrashIcon className="size-4 text-destructive" />
          </Button>
        </div>

        <div className="space-y-2">
          <p className="font-medium text-muted-foreground text-xs">{t('extraOptions')}</p>
          {options.map(option => (
            <div className="group/option flex items-center gap-2" key={option.id}>
              <button
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                  option.isCorrect ? 'border-brand-secondary bg-brand-secondary text-white' : 'border-input'
                )}
                onClick={() => onOptionCorrectToggle(option.id)}
                type="button"
              >
                {option.isCorrect && <CheckIcon className="size-2.5" />}
              </button>
              <Input
                className="h-8 flex-1 text-sm"
                onChange={e => onOptionContentChange(option.id, e.target.value)}
                placeholder={t('extraOptionPlaceholder', { lang: tLang(language).toLowerCase() })}
                value={option.content[language] ?? ''}
              />
              <Button
                className="opacity-0 transition-opacity group-hover/option:opacity-100"
                onClick={() => onRemoveOption(option.id)}
                size="icon"
                variant="ghost"
              >
                <TrashIcon className="size-3 text-destructive" />
              </Button>
            </div>
          ))}
          <Button className="h-7 text-xs" onClick={onAddOption} size="sm" variant="ghost">
            <PlusIcon className="size-3" />
            {t('addExtraOption')}
          </Button>
        </div>

        <div className="space-y-1">
          <p className="font-medium text-muted-foreground text-xs">{t('extraExplanation')}</p>
          <Textarea
            className="min-h-10 text-sm"
            onChange={e => onExplanationChange(e.target.value)}
            placeholder={t('extraExplanationPlaceholder', { lang: tLang(language).toLowerCase() })}
            value={explanation}
          />
        </div>
      </div>
    )
  }
)

export const LessonExtras = ({ className }: { className?: string }) => {
  const t = useTranslations('Courses')

  const { course, currentLesson, language, setCourse, step } = useCourse()
  const { user } = useSession()

  const isSkillCourse = course.type === 'skill'
  const canEdit = user.canEdit && !course.archivedAt

  const hasExtra =
    currentLesson.questions.length > 0 || currentLesson.evaluations.length > 0 || !!currentLesson.assessment

  const addQuestion = useCallback(() => {
    const question = {
      id: Date.now(),
      description: intlPlaceholder,
      explanation: null,
      answered: false,
      options: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lessonId: currentLesson.id,
    }
    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.map((lesson, i) =>
        i === step - 1 ? { ...lesson, questions: [...lesson.questions, question] } : lesson
      ),
    }) as Course)
  }, [currentLesson.id, setCourse, step])

  const addEvaluation = useCallback(() => {
    const evaluation = {
      id: Date.now() + 1,
      description: intlPlaceholder,
    } as Evaluation
    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.map((lesson, i) =>
        i === step - 1 ? { ...lesson, evaluations: [...lesson.evaluations, evaluation] } : lesson
      ),
    }))
  }, [setCourse, step])

  const addAssessment = useCallback(() => {
    const assessment = {
      id: Date.now() + 2,
      description: intlPlaceholder,
      userRating: 0,
      userAssessments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lessonId: currentLesson.id,
    } as Assessment
    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.map((lesson, i) => (i === step - 1 ? { ...lesson, assessment } : lesson)),
    }))
  }, [currentLesson.id, setCourse, step])

  const updateQuestionDescription = useCallback(
    (questionId: number, value: string) => {
      setCourse(prev => ({
        ...prev,
        lessons: prev.lessons.map((lesson, i) =>
          i === step - 1
            ? {
                ...lesson,
                questions: lesson.questions.map(q =>
                  q.id === questionId ? { ...q, description: { ...q.description, [language]: value } } : q
                ),
              }
            : lesson
        ),
      }))
    },
    [language, setCourse, step]
  )

  const updateQuestionExplanation = useCallback(
    (questionId: number, value: string) => {
      setCourse(prev => ({
        ...prev,
        lessons: prev.lessons.map((lesson, i) =>
          i === step - 1
            ? {
                ...lesson,
                questions: lesson.questions.map(q =>
                  q.id === questionId
                    ? {
                        ...q,
                        explanation: { ...((q.explanation ?? intlPlaceholder) as IntlRecord), [language]: value },
                      }
                    : q
                ),
              }
            : lesson
        ),
      }))
    },
    [language, setCourse, step]
  )

  const addQuestionOption = useCallback(
    (questionId: number) => {
      const newOption = {
        id: Date.now(),
        content: { [language]: '' },
        is_correct: false,
        isUserAnswer: false,
      } as unknown as QuestionOption
      setCourse(prev => ({
        ...prev,
        lessons: prev.lessons.map((lesson, i) =>
          i === step - 1
            ? {
                ...lesson,
                questions: lesson.questions.map(q =>
                  q.id === questionId ? { ...q, options: [...q.options, newOption] } : q
                ),
              }
            : lesson
        ),
      }))
    },
    [setCourse, step, language]
  )

  const updateOptionContent = useCallback(
    (questionId: number, optionId: number, value: string) => {
      setCourse(prev => ({
        ...prev,
        lessons: prev.lessons.map((lesson, i) =>
          i === step - 1
            ? {
                ...lesson,
                questions: lesson.questions.map(q =>
                  q.id === questionId
                    ? {
                        ...q,
                        options: q.options.map(o =>
                          o.id === optionId
                            ? {
                                ...o,
                                content: {
                                  ...((o.content as unknown as IntlRecord) ?? intlPlaceholder),
                                  [language]: value,
                                },
                              }
                            : o
                        ),
                      }
                    : q
                ),
              }
            : lesson
        ),
      }))
    },
    [language, setCourse, step]
  )

  const toggleOptionCorrect = useCallback(
    (questionId: number, optionId: number) => {
      setCourse(prev => ({
        ...prev,
        lessons: prev.lessons.map((lesson, i) =>
          i === step - 1
            ? {
                ...lesson,
                questions: lesson.questions.map(q =>
                  q.id === questionId
                    ? {
                        ...q,
                        options: q.options.map(o => ({
                          ...o,
                          is_correct: o.id === optionId,
                        })),
                      }
                    : q
                ),
              }
            : lesson
        ),
      }))
    },
    [setCourse, step]
  )

  const removeOption = useCallback(
    (questionId: number, optionId: number) => {
      setCourse(prev => ({
        ...prev,
        lessons: prev.lessons.map((lesson, i) =>
          i === step - 1
            ? {
                ...lesson,
                questions: lesson.questions.map(q =>
                  q.id === questionId ? { ...q, options: q.options.filter(o => o.id !== optionId) } : q
                ),
              }
            : lesson
        ),
      }))
    },
    [setCourse, step]
  )

  const updateEvaluationDescription = useCallback(
    (evaluationId: number, value: string) => {
      setCourse(prev => ({
        ...prev,
        lessons: prev.lessons.map((lesson, i) =>
          i === step - 1
            ? {
                ...lesson,
                evaluations: lesson.evaluations.map(e =>
                  e.id === evaluationId ? { ...e, description: { ...e.description, [language]: value } } : e
                ),
              }
            : lesson
        ),
      }))
    },
    [language, setCourse, step]
  )

  const updateAssessmentDescription = useCallback(
    (value: string) => {
      setCourse(prev => ({
        ...prev,
        lessons: prev.lessons.map((lesson, i) =>
          i === step - 1 && lesson.assessment
            ? {
                ...lesson,
                assessment: {
                  ...lesson.assessment,
                  description: { ...lesson.assessment.description, [language]: value } as IntlRecord,
                },
              }
            : lesson
        ),
      }))
    },
    [language, setCourse, step]
  )

  const removeQuestion = useCallback(
    (questionId: number) => {
      setCourse(prev => ({
        ...prev,
        lessons: prev.lessons.map((lesson, i) =>
          i === step - 1 ? { ...lesson, questions: lesson.questions.filter(q => q.id !== questionId) } : lesson
        ),
      }))
    },
    [setCourse, step]
  )

  const removeEvaluation = useCallback(
    (evaluationId: number) => {
      setCourse(prev => ({
        ...prev,
        lessons: prev.lessons.map((lesson, i) =>
          i === step - 1 ? { ...lesson, evaluations: lesson.evaluations.filter(e => e.id !== evaluationId) } : lesson
        ),
      }))
    },
    [setCourse, step]
  )

  const removeAssessment = useCallback(() => {
    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.map((lesson, i) => (i === step - 1 ? { ...lesson, assessment: undefined } : lesson)),
    }))
  }, [setCourse, step])

  const onAddExtra = useCallback(
    (type: LessonType) => {
      if (type === 'questions') return addQuestion()
      if (type === 'evaluations') return addEvaluation()
      if (type === 'assessment') return addAssessment()
    },
    [addAssessment, addEvaluation, addQuestion]
  )

  if (!(isSkillCourse && canEdit)) return null

  return (
    <div className={cn('space-y-6', className)}>
      {hasExtra && <div className="border-t-2" />}

      {currentLesson.questions.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-1.5 font-semibold text-sm">
            <MessageCircleQuestionIcon className="size-4" />
            {t('questionsTitle')}
          </h4>
          <div className="space-y-4">
            {currentLesson.questions.map((question, index) => (
              <QuestionItem
                description={(question.description as IntlRecord)?.[language] ?? ''}
                explanation={question.explanation?.[language] ?? ''}
                key={question.id}
                label={`${t('extraQuestion')} ${index + 1}`}
                language={language}
                onAddOption={() => addQuestionOption(question.id)}
                onDescriptionChange={value => updateQuestionDescription(question.id, value)}
                onExplanationChange={value => updateQuestionExplanation(question.id, value)}
                onOptionContentChange={(optionId, value) => updateOptionContent(question.id, optionId, value)}
                onOptionCorrectToggle={optionId => toggleOptionCorrect(question.id, optionId)}
                onRemove={() => removeQuestion(question.id)}
                onRemoveOption={optionId => removeOption(question.id, optionId)}
                options={question.options}
              />
            ))}
          </div>
          <Button className="h-7 text-xs" onClick={addQuestion} size="sm" variant="outline">
            <PlusIcon className="size-3" />
            {t('addExtraQuestion')}
          </Button>
        </div>
      )}

      {currentLesson.evaluations.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-1.5 font-semibold text-sm">
            <ClipboardListIcon className="size-4" />
            {t('subskillEvaluationsTitle')}
          </h4>
          <div className="space-y-4">
            {currentLesson.evaluations.map((evaluation, index) => (
              <div className="space-y-3" key={evaluation.id}>
                <ExtraItem
                  description={(evaluation.description as IntlRecord)?.[language] ?? ''}
                  label={`${t('extraEvaluation')} ${index + 1}`}
                  language={language}
                  onDescriptionChange={value => updateEvaluationDescription(evaluation.id, value)}
                  onRemove={() => removeEvaluation(evaluation.id)}
                />
                {/* <RatingGroup
                  className="pointer-events-none opacity-50"
                  color="brand"
                  disabled
                  id={`evaluation-${evaluation.id}`}
                /> */}
              </div>
            ))}
          </div>
          <Button className="h-7 text-xs" onClick={addEvaluation} size="sm" variant="outline">
            <PlusIcon className="size-3" />
            {t('addExtraEvaluation')}
          </Button>
        </div>
      )}

      {currentLesson.assessment && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-1.5 font-semibold text-sm">
            <StarIcon className="size-4" />
            {t('skillEvaluationTitle')}
          </h4>
          <ExtraItem
            description={(currentLesson.assessment.description as IntlRecord)?.[language] ?? ''}
            label={t('extraAssessment')}
            language={language}
            onDescriptionChange={updateAssessmentDescription}
            onRemove={removeAssessment}
          />
          {/* <RatingGroup
            className="pointer-events-none opacity-50"
            color="brand"
            disabled
            id={`assessment-${currentLesson.assessment.id}`}
          /> */}
        </div>
      )}

      {!hasExtra && (
        <div className="flex w-full items-center justify-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="rounded-full" size="icon" variant="brand">
                <PlusIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onAddExtra('questions')}>
                <MessageCircleQuestionIcon className="size-4" />
                {t('addExtraQuestion')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddExtra('evaluations')}>
                <ClipboardListIcon className="size-4" />
                {t('addExtraEvaluation')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddExtra('assessment')}>
                <StarIcon className="size-4" />
                {t('addExtraAssessment')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
