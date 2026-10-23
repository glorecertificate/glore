'use client'

import { useTranslations } from 'next-intl'

import { LevelDots } from '@/components/ui/level-dots'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { SegmentedControlItem } from '@/components/ui/segmented-control-item'
import { SKILL_LEVELS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export const LevelPicker = ({
  className,
  min = 1,
  onValueChange,
  value,
  ...props
}: Omit<React.ComponentProps<typeof SegmentedControl>, 'defaultValue' | 'onValueChange' | 'value'> & {
  min?: number
  onValueChange: (level: number) => void
  value?: number
}) => {
  const t = useTranslations('Common.skillLevels')
  const selected = SKILL_LEVELS[(value ?? 0) - 1]

  return (
    <div className={cn('@container flex flex-col gap-2', className)} data-slot="level-picker">
      <SegmentedControl
        className="w-full"
        onValueChange={next => onValueChange(Number(next))}
        value={value ? String(value) : ''}
        {...props}
      >
        {SKILL_LEVELS.map((name, index) => (
          <SegmentedControlItem
            className="flex-auto px-1.5 text-xs @md:px-3 @md:text-sm"
            disabled={index + 1 < min}
            key={name}
            value={String(index + 1)}
          >
            {t(name)}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      {value && selected ? <LevelDots label={t(selected)} level={value as 1 | 2 | 3 | 4 | 5} /> : null}
    </div>
  )
}
