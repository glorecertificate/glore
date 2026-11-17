import 'server-only'

import { createHmac, hkdfSync } from 'node:crypto'

import { type Locale } from 'next-intl'

import { pickLocale } from '@/db/queries/learning'
import { type LevelTexts, SKILL_LEVELS, type SkillLevel } from '@/db/queries/skill-level-description'

interface SkillChoiceCard {
  id: string
  text: string
}

export interface SkillChoice {
  cards: SkillChoiceCard[]
  chosenId: string | null
}

const TOKEN_LENGTH = 24

const tokenKey = () => Buffer.from(hkdfSync('sha256', process.env.BETTER_AUTH_SECRET, 'glore', 'skill-choice', 32))

export const skillChoiceToken = (userId: string, courseId: number, level: SkillLevel) =>
  createHmac('sha256', tokenKey()).update(`${userId}:${courseId}:${level}`).digest('hex').slice(0, TOKEN_LENGTH)

export const resolveSkillChoice = (userId: string, courseId: number, token: string | undefined | null) => {
  if (!token) return null
  return SKILL_LEVELS.find(level => skillChoiceToken(userId, courseId, level) === token) ?? null
}

export const buildSkillChoice = ({
  chosen,
  courseId,
  descriptions,
  language,
  userId,
}: {
  chosen: SkillLevel | null
  courseId: number
  descriptions: LevelTexts | undefined
  language: Locale
  userId: string
}): SkillChoice | null => {
  const cards = SKILL_LEVELS.map(level => ({
    id: skillChoiceToken(userId, courseId, level),
    text: pickLocale(descriptions?.[level], language) ?? '',
  }))
  if (cards.some(({ text }) => !text)) return null
  return {
    cards: cards.toSorted((a, b) => a.id.localeCompare(b.id)),
    chosenId: chosen ? skillChoiceToken(userId, courseId, chosen) : null,
  }
}
