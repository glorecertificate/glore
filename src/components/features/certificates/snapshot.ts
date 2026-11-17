import { SKILL_LEVELS, type SkillLevel } from '@/db/queries/skill-level-description'
import { type CertificateSnapshot } from '@/db/schema'
import { type IntlRecord, LOCALES } from '@/lib/i18n'

type SnapshotSkill = CertificateSnapshot['skills'][number]

export interface SkillRendering {
  description: IntlRecord | null
  label: string | null
  level: number
  steps: number
}

const LEGACY_STEPS = 5

const LEGACY_TO_CURRENT = [1, 1, 1, 2, 3] as const

const everyLocale = (text: string) => Object.fromEntries(LOCALES.map(locale => [locale, text])) as IntlRecord

export const renderSnapshotSkill = (skill: SnapshotSkill, frozenLevels?: string[]): SkillRendering => {
  if (typeof skill.level === 'string') {
    return {
      description: skill.description ?? null,
      label: null,
      level: SKILL_LEVELS.indexOf(skill.level) + 1,
      steps: SKILL_LEVELS.length,
    }
  }

  const description = skill.statement ? everyLocale(skill.statement) : null
  const level = Math.max(0, Math.min(LEGACY_STEPS, skill.level))
  if (frozenLevels?.length === LEGACY_STEPS) {
    return { description, label: frozenLevels[level - 1] ?? null, level, steps: LEGACY_STEPS }
  }
  return { description, label: null, level: LEGACY_TO_CURRENT[level - 1] ?? 0, steps: SKILL_LEVELS.length }
}

export const issuedSkillRendering = (
  snapshot: CertificateSnapshot | null,
  courseId: number,
  level: SkillLevel | null
): SkillRendering | null => {
  const skill = snapshot?.skills.find(item => item.courseId === courseId)
  if (skill) return renderSnapshotSkill(skill, snapshot?.labels?.levels)
  if (!level) return null
  return { description: null, label: null, level: SKILL_LEVELS.indexOf(level) + 1, steps: SKILL_LEVELS.length }
}
