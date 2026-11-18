'use client'

import { useTranslations } from 'next-intl'

import { SegmentedControl } from '@/components/ui/segmented-control'
import { SegmentedControlItem } from '@/components/ui/segmented-control-item'

export const PublishControl = ({
  disabled,
  language,
  onChange,
  published,
}: {
  disabled?: boolean
  language: string
  onChange: (published: boolean) => void
  published: boolean
}) => {
  const t = useTranslations('CourseEditor')

  return (
    <SegmentedControl
      aria-label={t('publishStatus', { language })}
      className="shrink-0"
      disabled={disabled}
      onValueChange={value => onChange(value === 'published')}
      value={published ? 'published' : 'draft'}
    >
      <SegmentedControlItem value="draft">{t('publishSwitchDraft')}</SegmentedControlItem>
      <SegmentedControlItem
        className="data-[state=checked]:bg-success-subtle data-[state=checked]:text-success-text dark:data-[state=checked]:bg-success-subtle"
        value="published"
      >
        {t('publishSwitchPublished')}
      </SegmentedControlItem>
    </SegmentedControl>
  )
}
