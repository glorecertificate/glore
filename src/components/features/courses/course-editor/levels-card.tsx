'use client'

import { type Locale, useTranslations } from 'next-intl'

import { ActivityCard } from '@/components/features/courses/course-editor/activity-card'
import { LevelField } from '@/components/features/courses/course-editor/level-field'
import { useLanguageName } from '@/components/features/courses/course-editor/use-language-name'
import { SKILL_LEVELS, type SkillLevel } from '@/db/queries/skill-level-description'

interface LevelsCardProps extends Omit<React.ComponentProps<'div'>, 'children' | 'id' | 'onChange'> {
  deleteLabel: string
  descriptions: Partial<Record<SkillLevel, string>>
  label: string
  language: Locale
  onChange: (level: SkillLevel, value: string) => void
  onRemove: () => void
}

export const LevelsCard = ({
  deleteLabel,
  descriptions,
  label,
  language,
  onChange,
  onRemove,
  ...props
}: LevelsCardProps) => {
  const t = useTranslations('CourseEditor')
  const tLevels = useTranslations('Common.skillLevels')
  const languageName = useLanguageName(language)

  return (
    <ActivityCard deleteLabel={deleteLabel} label={label} onRemove={onRemove} {...props}>
      <p className="text-sm text-muted-foreground">{t('levelDescriptionsHint')}</p>
      <div className="space-y-4">
        {SKILL_LEVELS.map((level, index) => (
          <LevelField
            first={index === 0}
            key={level}
            label={tLevels(level)}
            language={languageName}
            onChange={value => onChange(level, value)}
            value={descriptions[level] ?? ''}
          />
        ))}
      </div>
    </ActivityCard>
  )
}
