import { type Locale, useTranslations } from 'next-intl'

import { type SkillRendering } from '@/components/features/certificates/snapshot'
import { LevelDots } from '@/components/ui/level-dots'
import { SKILL_LEVELS } from '@/db/queries/skill-level-description'
import { DEFAULT_LOCALE, localizeRecord } from '@/lib/i18n'

export const SkillLevel = ({ locale, rendering }: { locale: Locale; rendering: SkillRendering }) => {
  const t = useTranslations('Common.skillLevels')
  const { description, label, level, steps } = rendering
  const name = SKILL_LEVELS[level - 1]
  const text = label ?? (name ? t(name) : null)

  return (
    <>
      {text && <LevelDots label={text} level={level} steps={steps} />}
      {description && (
        <p className="text-sm text-muted-foreground">{localizeRecord(description, locale, DEFAULT_LOCALE)}</p>
      )}
    </>
  )
}
