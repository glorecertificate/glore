'use client'

import { type Locale, useTranslations } from 'next-intl'

import { ActivityCard } from '@/components/features/courses/course-editor/activity-card'
import { useDraft } from '@/components/features/courses/course-editor/use-draft'
import { useLanguageName } from '@/components/features/courses/course-editor/use-language-name'
import { Textarea } from '@/components/ui/textarea'

interface DescriptionCardProps extends Omit<React.ComponentProps<'div'>, 'children' | 'id'> {
  deleteLabel: string
  description: string
  label: string
  language: Locale
  onDescriptionChange: (value: string) => void
  onRemove: () => void
}

export const DescriptionCard = ({
  deleteLabel,
  description,
  label,
  language,
  onDescriptionChange,
  onRemove,
  ...props
}: DescriptionCardProps) => {
  const t = useTranslations('CourseEditor')
  const languageName = useLanguageName(language)
  const { draft, onBlur, onChange } = useDraft(description, onDescriptionChange)

  return (
    <ActivityCard deleteLabel={deleteLabel} label={label} onRemove={onRemove} {...props}>
      <Textarea
        aria-label={label}
        className="min-h-16 resize-none"
        data-activity-field
        onBlur={onBlur}
        onChange={event => onChange(event.target.value)}
        placeholder={t('activityDescriptionPlaceholder', { lang: languageName })}
        value={draft}
      />
    </ActivityCard>
  )
}
