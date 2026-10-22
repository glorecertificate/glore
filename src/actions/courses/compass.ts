'use server'

import 'server-only'

import { updateTag } from 'next/cache'

import { type Locale } from 'next-intl'
import { getLocale } from 'next-intl/server'
import { z } from 'zod'

import { getLearningContext } from '@/actions/courses/learner'
import { saveCompass } from '@/actions/courses/learning'
import { progressUserTag } from '@/lib/cache'

const idList = z.array(z.number().int().positive()).max(20)
const compassSchema = z.object({ goals: idList, strengths: idList })

export const saveSkillCompass = async (input: z.input<typeof compassSchema>) => {
  const parsed = compassSchema.safeParse(input)
  if (!parsed.success) return { error: { code: 'INVALID_INPUT', message: 'Invalid values' } }

  const { orgId, role, user } = await getLearningContext()
  if (user.banned) return { error: { code: 'FORBIDDEN', message: 'Not allowed' } }

  const result = await saveCompass(
    { canEdit: user.canEdit, organizationId: orgId, role, userId: user.id },
    parsed.data,
    (await getLocale()) as Locale
  )
  if ('error' in result) return { error: { code: result.error, message: 'Compass rejected' } }

  updateTag(progressUserTag(user.id))
  return { data: result.data }
}
