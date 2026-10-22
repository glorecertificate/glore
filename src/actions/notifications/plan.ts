import { type InferSelectModel } from 'drizzle-orm'

import { type users } from '@/db/schema'
import { DEFAULT_LOCALE } from '@/lib/i18n'

type UserRow = InferSelectModel<typeof users>

type NotificationCategory = keyof UserRow['notificationPreferences']

export type MailCategory = NotificationCategory | 'mandatory'

export type NotifyPerson = Pick<UserRow, 'banned' | 'email' | 'firstName' | 'id' | 'locale' | 'notificationPreferences'>

export type Recipient = { userId: string } | { email: string; locale: string | null; name: string | null }

export interface PlannedMail {
  email: string
  locale: string
  name: string | null
  userId: string | null
}

interface PlanInput {
  actorId: string | null
  category: MailCategory | null
  emailTo: Recipient[]
  fallbackLocale: string | null
  inApp: string[]
  notifyActor: boolean
  people: NotifyPerson[]
}

export const planNotifications = ({
  actorId,
  category,
  emailTo,
  fallbackLocale,
  inApp,
  notifyActor,
  people,
}: PlanInput) => {
  const byId = new Map(people.map(person => [person.id, person]))
  const isActor = (id: string) => !notifyActor && id === actorId
  const inAppIds = [...new Set(inApp)].filter(id => {
    const person = byId.get(id)
    return Boolean(person && !person.banned && !isActor(id))
  })

  if (!category) return { inAppIds, mails: [] }

  const mails = new Map<string, PlannedMail>()
  for (const recipient of emailTo) {
    if ('email' in recipient) {
      const key = recipient.email.trim().toLowerCase()
      if (!mails.has(key)) {
        mails.set(key, {
          email: recipient.email,
          locale: recipient.locale ?? fallbackLocale ?? DEFAULT_LOCALE,
          name: recipient.name,
          userId: null,
        })
      }
      continue
    }
    const person = byId.get(recipient.userId)
    if (!person || isActor(person.id)) continue
    if (category !== 'mandatory' && (person.banned || person.notificationPreferences[category] === false)) continue
    const key = person.email.trim().toLowerCase()
    if (mails.has(key)) continue
    mails.set(key, {
      email: person.email,
      locale: person.locale ?? fallbackLocale ?? DEFAULT_LOCALE,
      name: person.firstName,
      userId: person.id,
    })
  }

  return { inAppIds, mails: [...mails.values()] }
}
