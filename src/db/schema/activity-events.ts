import { index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { type JsonbObject } from './helpers'
import { organizations } from './organizations'
import { users } from './users'

export const activityEvents = pgTable(
  'activity_events',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    actorId: text().references(() => users.id, { onDelete: 'set null' }),
    organizationId: integer().references(() => organizations.id, { onDelete: 'set null' }),
    subjectType: text().notNull(),
    subjectId: text().notNull(),
    action: text().notNull(),
    metadata: jsonb().$type<JsonbObject>().default({}).notNull(),
    createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  },
  table => [
    index('activity_events_subject_idx').on(table.subjectType, table.subjectId, table.createdAt),
    index('activity_events_organization_id_idx').on(table.organizationId, table.createdAt),
    index('activity_events_organization_id_id_idx').on(table.organizationId, table.id),
    index('activity_events_created_at_id_idx').on(table.createdAt, table.id),
    index('activity_events_actor_id_idx').on(table.actorId),
  ]
)
