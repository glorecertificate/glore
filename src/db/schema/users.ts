import { boolean, date, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().default(false).notNull(),
  phone: text(),
  username: text().unique(),
  displayUsername: text(),
  firstName: text().notNull(),
  lastName: text(),
  bio: text(),
  birthday: date({ mode: 'string' }),
  sex: text(),
  pronouns: text(),
  country: text(),
  city: text(),
  languages: text().array(),
  locale: text(),
  avatarUrl: text(),
  role: text().default('user'),
  banned: boolean().default(false),
  banReason: text(),
  banExpires: timestamp({ mode: 'string' }),
  isEditor: boolean().default(false).notNull(),
  onboardedAt: timestamp({ mode: 'string' }),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
})
