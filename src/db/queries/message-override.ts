import { type InferSelectModel } from 'drizzle-orm'
import { z } from 'zod'

import { type messageOverrides } from '@/db/schema/message-overrides'
import { LOCALES } from '@/lib/i18n'

const MESSAGE_VALUE_MAX = 5000

const KEY_REGEX = /^[\w-]+(\.[\w/-]+)+$/u

export const messageTargetSchema = z.object({
  key: z.string().max(300).regex(KEY_REGEX),
  locale: z.enum(LOCALES),
})

export const messageDraftSchema = messageTargetSchema.extend({
  value: z.string().min(1).max(MESSAGE_VALUE_MAX),
})

export type MessageTarget = z.infer<typeof messageTargetSchema>

export const parseMessageOverride = (row: InferSelectModel<typeof messageOverrides>) => ({
  ...row,
  hasDraft: row.draftValue !== null,
  isPublished: row.value !== null,
})
