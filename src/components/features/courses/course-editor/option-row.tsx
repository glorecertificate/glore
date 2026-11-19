'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { DeleteButton } from '@/components/features/courses/course-editor/delete-button'
import { useDraft } from '@/components/features/courses/course-editor/use-draft'
import { LucideIcon } from '@/components/icons/lucide'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { cn } from '@/lib/utils'

interface OptionRowProps {
  content: string
  id: number
  isCorrect: boolean
  language: string
  number: number
  onChange: (value: string) => void
  onEnter: () => void
  onRemove: () => void
  onToggle: () => void
}

export const OptionRow = ({
  content,
  id,
  isCorrect,
  language,
  number,
  onChange,
  onEnter,
  onRemove,
  onToggle,
}: OptionRowProps) => {
  const t = useTranslations('CourseEditor')
  const { draft, onBlur, onChange: onDraftChange } = useDraft(content, onChange)
  const [touched, setTouched] = useState(false)

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return
    event.preventDefault()
    onEnter()
  }

  return (
    <InputGroup>
      <InputGroupAddon className="cursor-default">
        <button
          aria-label={t('markOptionCorrect', { number })}
          aria-pressed={isCorrect}
          className={cn(
            'touch-hit flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-colors outline-none focus-visible:focus-ring',
            isCorrect
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border-strong hover:border-primary'
          )}
          onClick={onToggle}
          type="button"
        >
          {isCorrect && <LucideIcon name="check" className="size-3" strokeWidth={3} />}
        </button>
      </InputGroupAddon>
      <InputGroupInput
        aria-invalid={touched && draft.trim() === ''}
        aria-label={t('optionNumber', { number })}
        data-option-id={id}
        onBlur={() => {
          onBlur()
          setTouched(true)
        }}
        onChange={event => onDraftChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={t('activityOptionPlaceholder', { lang: language })}
        value={draft}
      />
      <InputGroupAddon align="inline-end">
        <DeleteButton label={t('removeOption', { number })} onClick={onRemove} />
      </InputGroupAddon>
    </InputGroup>
  )
}
