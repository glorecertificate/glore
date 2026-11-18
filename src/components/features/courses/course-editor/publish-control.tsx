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
      className="shrink-0 bg-band-scrim"
      disabled={disabled}
      onValueChange={value => onChange(value === 'published')}
      value={published ? 'published' : 'draft'}
    >
      <SegmentedControlItem
        className="text-band-text data-[state=checked]:bg-band-foreground data-[state=checked]:text-band-from dark:data-[state=checked]:bg-band-foreground"
        value="draft"
      >
        {t('publishSwitchDraft')}
      </SegmentedControlItem>
      <SegmentedControlItem
        className="text-band-text data-[state=checked]:bg-band-action data-[state=checked]:text-band-action-foreground dark:data-[state=checked]:bg-band-action"
        value="published"
      >
        {t('publishSwitchPublished')}
      </SegmentedControlItem>
    </SegmentedControl>
  )
}
