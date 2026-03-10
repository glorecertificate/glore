import { type InferSelectModel } from 'drizzle-orm'

import { type organizations } from '@/db/schema'

export type Organization = InferSelectModel<typeof organizations>
