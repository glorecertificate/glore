'use client'

import { CheckIcon, ClipboardListIcon, MessageCircleQuestionIcon, PlusIcon, StarIcon, TrashIcon } from 'lucide-react'
import { type Locale, useTranslations } from 'next-intl'

import { useCourse } from '@/components/features/courses/course-editor/context'
import { useSession } from '@/components/providers/session'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { type Course } from '@/db/queries/course'
import { type Assessment, type Evaluation, type LessonType, type QuestionOption } from '@/db/queries/lesson'
import { INTL_PLACEHOLDER, type IntlRecord } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const ActivityItem = ({
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
    <div className="group flex items-start gap-2 rounded-xl border bg-card p-4">
      <div className="flex-1 space-y-1.5">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        <Textarea
          className="min-h-10 resize-none rounded-lg text-sm"
          onChange={e => onDescriptionChange(e.target.value)}
          placeholder={t('activityDescriptionPlaceholder', { lang: tLang(language).toLowerCase() })}
          value={description}
        />
      </div>
      <Button
        className="opacity-0 transition-opacity group-hover:opacity-100"
        onClick={onRemove}
        size="icon"
        type="button"
        variant="ghost"
      >
        <TrashIcon className="size-4 text-destructive" />
      </Button>
    </div>
  )
}

const QuestionItem = ({
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
    <div className="group/question space-y-4 rounded-xl border bg-card p-4">
      <div className="flex items-start gap-2">
        <div className="flex-1 space-y-1.5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
          <div className="pl-7">
            <Textarea
              className="min-h-10 resize-none rounded-lg text-sm"
              onChange={e => onDescriptionChange(e.target.value)}
              placeholder={t('activityQuestionPlaceholder', { lang: tLang(language).toLowerCase() })}
              value={description}
            />
          </div>
        </div>
        <Button
          className="opacity-0 transition-opacity group-hover/question:opacity-100"
          onClick={onRemove}
          size="icon"
          type="button"
          variant="ghost"
        >
          <TrashIcon className="size-4 text-destructive" />
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{t('activityOptions')}</p>
        {options.map(option => (
          <div className="group/option flex items-center gap-2" key={option.id}>
            <button
              aria-label={t('activityOptionCorrect')}
              aria-pressed={option.isCorrect}
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                option.isCorrect
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input hover:border-primary/60'
              )}
              onClick={() => onOptionCorrectToggle(option.id)}
              type="button"
            >
              {option.isCorrect && <CheckIcon className="size-3" strokeWidth={3} />}
            </button>
            <Input
              className="h-9 flex-1 rounded-lg text-sm"
              onChange={e => onOptionContentChange(option.id, e.target.value)}
              placeholder={t('activityOptionPlaceholder', { lang: tLang(language).toLowerCase() })}
              value={option.content[language] ?? ''}
            />
            <Button
              className="opacity-0 transition-opacity group-hover/option:opacity-100"
              onClick={() => onRemoveOption(option.id)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <TrashIcon className="size-3.5 text-destructive" />
            </Button>
          </div>
        ))}
        <Button
          className="ml-7 h-7 text-xs text-muted-foreground"
          onClick={onAddOption}
          size="sm"
          type="button"
          variant="ghost"
        >
          <PlusIcon className="size-3" />
          {t('addActivityOption')}
        </Button>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{t('activityExplanation')}</p>
        <div className="pl-7">
          <Textarea
            className="min-h-10 resize-none rounded-lg text-sm"
            onChange={e => onExplanationChange(e.target.value)}
            placeholder={t('activityExplanationPlaceholder', { lang: tLang(language).toLowerCase() })}
            value={explanation}
          />
        </div>
      </div>
    </div>
  )
}

export const LessonActivities = ({ className }: { className?: string }) => {
  const t = useTranslations('Courses')

  const { course, currentLesson, language, setCourse, step } = useCourse()
  const { user } = useSession()

  const canEdit = user.canEdit && !course.archivedAt

  const hasActivity =
    currentLesson.questions.length > 0 || currentLesson.evaluations.length > 0 || !!currentLesson.assessment

  const addQuestion = () => {
    const now = Date.now()
    const question = {
      id: now,
      description: INTL_PLACEHOLDER,
      explanation: null,
      answered: false,
      options: [
        { id: now + 1, content: { [language]: '' }, isCorrect: true, isUserAnswer: false },
        { id: now + 2, content: { [language]: '' }, isCorrect: false, isUserAnswer: false },
      ] as unknown as QuestionOption[],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lessonId: currentLesson.id,
    }
    setCourse(
      prev =>
        ({
          ...prev,
          lessons: prev.lessons.map((lesson, i) =>
            i === step - 1 ? { ...lesson, questions: [...lesson.questions, question] } : lesson
          ),
        }) as Course
    )
  }

  const addEvaluation = () => {
    const evaluation = {
      id: Date.now() + 1,
      description: INTL_PLACEHOLDER,
    } as Evaluation
    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.map((lesson, i) =>
        i === step - 1 ? { ...lesson, evaluations: [...lesson.evaluations, evaluation] } : lesson
      ),
    }))
  }

  const addAssessment = () => {
    const assessment = {
      id: Date.now() + 2,
      description: INTL_PLACEHOLDER,
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
  }

  const updateQuestionDescription = (questionId: number, value: string) => {
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
  }

  const updateQuestionExplanation = (questionId: number, value: string) => {
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
                      explanation: { ...((q.explanation ?? INTL_PLACEHOLDER) as IntlRecord), [language]: value },
                    }
                  : q
              ),
            }
          : lesson
      ),
    }))
  }

  const addQuestionOption = (questionId: number) => {
    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.map((lesson, i) =>
        i === step - 1
          ? {
              ...lesson,
              questions: lesson.questions.map(q => {
                if (q.id !== questionId) return q
                const newOption = {
                  id: Date.now(),
                  content: { [language]: '' },
                  isCorrect: !q.options.some(o => o.isCorrect),
                  isUserAnswer: false,
                } as unknown as QuestionOption
                return { ...q, options: [...q.options, newOption] }
              }),
            }
          : lesson
      ),
    }))
  }

  const updateOptionContent = (questionId: number, optionId: number, value: string) => {
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
                                ...((o.content as unknown as IntlRecord) ?? INTL_PLACEHOLDER),
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
  }

  const toggleOptionCorrect = (questionId: number, optionId: number) => {
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
                        isCorrect: o.id === optionId,
                      })),
                    }
                  : q
              ),
            }
          : lesson
      ),
    }))
  }

  const removeOption = (questionId: number, optionId: number) => {
    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.map((lesson, i) =>
        i === step - 1
          ? {
              ...lesson,
              questions: lesson.questions.map(q => {
                if (q.id !== questionId) return q
                const options = q.options.filter(o => o.id !== optionId)
                if (options.length > 0 && !options.some(o => o.isCorrect)) {
                  options[0] = { ...options[0], isCorrect: true }
                }
                return { ...q, options }
              }),
            }
          : lesson
      ),
    }))
  }

  const updateEvaluationDescription = (evaluationId: number, value: string) => {
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
  }

  const updateAssessmentDescription = (value: string) => {
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
  }

  const removeQuestion = (questionId: number) => {
    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.map((lesson, i) =>
        i === step - 1 ? { ...lesson, questions: lesson.questions.filter(q => q.id !== questionId) } : lesson
      ),
    }))
  }

  const removeEvaluation = (evaluationId: number) => {
    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.map((lesson, i) =>
        i === step - 1 ? { ...lesson, evaluations: lesson.evaluations.filter(e => e.id !== evaluationId) } : lesson
      ),
    }))
  }

  const removeAssessment = () => {
    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.map((lesson, i) => (i === step - 1 ? { ...lesson, assessment: undefined } : lesson)),
    }))
  }

  const onAddActivity = (type: LessonType) => {
    if (type === 'questions') return addQuestion()
    if (type === 'evaluations') return addEvaluation()
    if (type === 'assessment') return addAssessment()
  }

  if (!canEdit) return null

  return (
    <div className={cn('space-y-6', className)}>
      {currentLesson.questions.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-1.5 text-sm font-semibold">
            <MessageCircleQuestionIcon className="size-4" />
            {t('questionsTitle')}
          </h4>
          <div className="space-y-4">
            {currentLesson.questions.map((question, index) => (
              <QuestionItem
                description={(question.description as IntlRecord)?.[language] ?? ''}
                explanation={question.explanation?.[language] ?? ''}
                key={question.id}
                label={`${t('activityQuestion')} ${index + 1}`}
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
          <Button className="h-7 text-xs" onClick={addQuestion} size="sm" type="button" variant="outline">
            <PlusIcon className="size-3" />
            {t('addActivityQuestion')}
          </Button>
        </div>
      )}

      {currentLesson.evaluations.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-1.5 text-sm font-semibold">
            <ClipboardListIcon className="size-4" />
            {t('subskillEvaluationsTitle')}
          </h4>
          <div className="space-y-4">
            {currentLesson.evaluations.map((evaluation, index) => (
              <div className="space-y-3" key={evaluation.id}>
                <ActivityItem
                  description={(evaluation.description as IntlRecord)?.[language] ?? ''}
                  label={`${t('activityEvaluation')} ${index + 1}`}
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
          <Button className="h-7 text-xs" onClick={addEvaluation} size="sm" type="button" variant="outline">
            <PlusIcon className="size-3" />
            {t('addActivityEvaluation')}
          </Button>
        </div>
      )}

      {currentLesson.assessment && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-1.5 text-sm font-semibold">
            <StarIcon className="size-4" />
            {t('skillEvaluationTitle')}
          </h4>
          <ActivityItem
            description={(currentLesson.assessment.description as IntlRecord)?.[language] ?? ''}
            label={t('activityAssessment')}
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

      {!hasActivity && (
        <div className="flex w-full items-center justify-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="rounded-full" size="icon" type="button" variant="brand">
                <PlusIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onAddActivity('questions')}>
                <MessageCircleQuestionIcon className="size-4" />
                {t('addActivityQuestion')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddActivity('evaluations')}>
                <ClipboardListIcon className="size-4" />
                {t('addActivityEvaluation')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddActivity('assessment')}>
                <StarIcon className="size-4" />
                {t('addActivityAssessment')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
