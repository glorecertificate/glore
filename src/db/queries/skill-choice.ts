import { type LevelTexts, SKILL_LEVELS } from '@/db/queries/skill-level-description'
import { LOCALES } from '@/lib/i18n'

export const hasEveryLevelDescription = (descriptions: LevelTexts | undefined) =>
  SKILL_LEVELS.every(level => LOCALES.some(locale => descriptions?.[level]?.[locale]?.trim()))
