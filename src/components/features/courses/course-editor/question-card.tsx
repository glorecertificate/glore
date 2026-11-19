'use client'

import { useEffect, useId, useRef, useState } from 'react'

import { type Locale, useTranslations } from 'next-intl'

import { ActivityCard } from '@/components/features/courses/course-editor/activity-card'
import { OptionRow } from '@/components/features/courses/course-editor/option-row'
import { useDraft } from '@/components/features/courses/course-editor/use-draft'
import { useLanguageName } from '@/components/features/courses/course-editor/use-language-name'
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { type QuestionOption } from '@/db/queries/lesson'
import { tempId } from '@/lib/utils'

interface QuestionCardProps {
  description: string
  explanation: string
  id: number
  label: string
  language: Locale
  number: number
  onAddOption: (optionId: number) => void
  onDescriptionChange: (value: string) => void
  onExplanationChange: (value: string) => void
  onOptionContentChange: (optionId: number, value: string) => void
  onOptionCorrectToggle: (optionId: number) => void
  onRemove: () => void
  onRemoveOption: (optionId: number) => void
  options: QuestionOption[]
}

const MIN_OPTIONS = 2

const focusOption = (optionId: number) => `[data-option-id="${optionId}"]`

export const QuestionCard = ({
  description,
  explanation,
  id,
  label,
  language,
  number,
  onAddOption,
  onDescriptionChange,
  onExplanationChange,
  onOptionContentChange,
  onOptionCorrectToggle,
  onRemove,
  onRemoveOption,
  options,
}: QuestionCardProps) => {
  const t = useTranslations('CourseEditor')
  const languageName = useLanguageName(language)
  const idPrefix = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const focusRef = useRef<string | null>(null)
  const [touched, setTouched] = useState(false)
  const question = useDraft(description, onDescriptionChange)
  const explanationDraft = useDraft(explanation, onExplanationChange)

  useEffect(() => {
    const selector = focusRef.current
    if (!selector) return
    focusRef.current = null
    rootRef.current?.querySelector<HTMLElement>(selector)?.focus()
  }, [options])

  const addOption = () => {
    const optionId = tempId()
    focusRef.current = focusOption(optionId)
    onAddOption(optionId)
  }

  const removeOption = (index: number) => {
    const neighbor = options[index + 1] ?? options[index - 1]
    focusRef.current = neighbor ? focusOption(neighbor.id) : '[data-add-option]'
    onRemoveOption(options[index].id)
  }

  const onOptionEnter = (index: number) => {
    const next = options[index + 1]
    if (!next) return addOption()
    rootRef.current?.querySelector<HTMLElement>(focusOption(next.id))?.focus()
  }

  return (
    <ActivityCard
      data-question-id={id}
      deleteLabel={t('removeQuestion', { number })}
      label={label}
      onRemove={onRemove}
      ref={rootRef}
    >
      <div className="space-y-5">
        <Textarea
          aria-invalid={touched && question.draft.trim() === ''}
          aria-label={label}
          className="min-h-16 resize-none"
          data-question-field
          onBlur={() => {
            question.onBlur()
            setTouched(true)
          }}
          onChange={event => question.onChange(event.target.value)}
          placeholder={t('activityQuestionPlaceholder', { lang: languageName })}
          value={question.draft}
        />

        <fieldset className="min-w-0 space-y-2">
          <legend className="mb-2 type-label text-foreground">{t('activityOptions')}</legend>
          <AnimatedList>
            {options.map((option, index) => (
              <AnimatedListItem key={option.id} variant="row">
                <OptionRow
                  content={option.content[language] ?? ''}
                  id={option.id}
                  isCorrect={option.isCorrect}
                  language={languageName}
                  number={index + 1}
                  onChange={value => onOptionContentChange(option.id, value)}
                  onEnter={() => onOptionEnter(index)}
                  onRemove={() => removeOption(index)}
                  onToggle={() => onOptionCorrectToggle(option.id)}
                />
              </AnimatedListItem>
            ))}
          </AnimatedList>
          {options.length < MIN_OPTIONS && (
            <p className="type-caption text-destructive-text" role="alert">
              {t('quizMinOptionsHint', { count: MIN_OPTIONS })}
            </p>
          )}
          <Button data-add-option icon="plus" onClick={addOption} size="sm" type="button" variant="ghost">
            {t('addActivityOption')}
          </Button>
        </fieldset>

        <div className="space-y-2">
          <label className="block type-label text-foreground" htmlFor={`${idPrefix}-explanation`}>
            {t('activityExplanation')}
          </label>
          <Textarea
            className="min-h-20 resize-none"
            id={`${idPrefix}-explanation`}
            onBlur={explanationDraft.onBlur}
            onChange={event => explanationDraft.onChange(event.target.value)}
            placeholder={t('activityExplanationPlaceholder', { lang: languageName })}
            value={explanationDraft.draft}
          />
        </div>
      </div>
    </ActivityCard>
  )
}
