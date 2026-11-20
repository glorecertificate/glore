'use client'

import { useId } from 'react'

import { useTranslations } from 'next-intl'

import { useDraft } from '@/components/features/courses/course-editor/use-draft'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SKILL_LEVEL_DESCRIPTION_MAX_LENGTH } from '@/db/queries/skill-level-description'
import { cn } from '@/lib/utils'

interface LevelFieldProps {
  first: boolean
  label: string
  language: string
  onChange: (value: string) => void
  value: string
}

export const LevelField = ({ first, label, language, onChange, value }: LevelFieldProps) => {
  const t = useTranslations('CourseEditor')
  const id = useId()
  const { draft, onBlur, onChange: onDraftChange } = useDraft(value, onChange)

  return (
    <div className="space-y-2">
      <Label className="type-label" htmlFor={id}>
        {label}
      </Label>
      <Textarea
        aria-describedby={`${id}-count`}
        className="min-h-16 resize-none"
        data-activity-field={first || undefined}
        id={id}
        maxLength={SKILL_LEVEL_DESCRIPTION_MAX_LENGTH}
        onBlur={onBlur}
        onChange={event => onDraftChange(event.target.value)}
        placeholder={t('activityDescriptionPlaceholder', { lang: language })}
        value={draft}
      />
      <p
        className={cn(
          'text-right type-caption text-muted-foreground tabular-nums',
          draft.length >= SKILL_LEVEL_DESCRIPTION_MAX_LENGTH && 'text-warning-text'
        )}
        id={`${id}-count`}
      >
        {t('levelDescriptionCount', { count: draft.length, max: SKILL_LEVEL_DESCRIPTION_MAX_LENGTH })}
      </p>
    </div>
  )
}
