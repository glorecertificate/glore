import { type InferSelectModel } from 'drizzle-orm'

import { type notifications } from '@/db/schema'

export type Notification = InferSelectModel<typeof notifications>
