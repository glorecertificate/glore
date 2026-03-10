import { timestamp } from 'drizzle-orm/pg-core'

import { type IntlRecord } from '@/lib/i18n'

export const timestamps = {
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
}

export type IntlJsonb = IntlRecord

export type IntlJsonbNullable = IntlRecord | null
