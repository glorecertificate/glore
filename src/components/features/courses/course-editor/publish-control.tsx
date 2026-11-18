'use client'

import { useTranslations } from 'next-intl'

import { SegmentedControl } from '@/components/ui/segmented-control'
import { SegmentedControlItem } from '@/components/ui/segmented-control-item'
import { cn } from '@/lib/utils'

const TOUCH_HIT = 'touch-hit-y'

export const PublishControl = ({
  disabled,
  language,
  tone = 'band',
  onChange,
  published,
}: {
  disabled?: boolean
  language: string
  onChange: (published: boolean) => void
  published: boolean
  tone?: 'band' | 'surface'
}) => {
  const t = useTranslations('CourseEditor')
  const isBand = tone === 'band'

  return (
    <SegmentedControl
      aria-label={t('publishStatus', { language })}
      className={cn('shrink-0', isBand && 'bg-band-scrim')}
      disabled={disabled}
      onValueChange={value => onChange(value === 'published')}
      value={published ? 'published' : 'draft'}
    >
      <SegmentedControlItem
        className={cn(
          !isBand && TOUCH_HIT,
          isBand &&
            'text-band-text data-[state=checked]:bg-band-foreground data-[state=checked]:text-band-from dark:data-[state=checked]:bg-band-foreground'
        )}
        value="draft"
      >
        {t('publishSwitchDraft')}
      </SegmentedControlItem>
      <SegmentedControlItem
        className={cn(
          !isBand && TOUCH_HIT,
          !isBand &&
            'data-[state=checked]:bg-success data-[state=checked]:text-success-foreground dark:data-[state=checked]:bg-success',
          isBand &&
            'text-band-text data-[state=checked]:bg-band-action data-[state=checked]:text-band-action-foreground dark:data-[state=checked]:bg-band-action'
        )}
        value="published"
      >
        {t('publishSwitchPublished')}
      </SegmentedControlItem>
    </SegmentedControl>
  )
}
