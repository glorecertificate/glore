import 'server-only'

import { revalidateTag } from 'next/cache'

import { inArray } from 'drizzle-orm'

import { EVENT_DEFINITIONS } from '@/actions/notifications/catalog'
import { type Recipient, planNotifications } from '@/actions/notifications/plan'
import { db } from '@/db/client'
import { type AppEvent, type EventType, eventMetadata } from '@/db/queries/activity-event'
import { notifications, users } from '@/db/schema'
import { notificationsUserTag } from '@/lib/cache'
import { sendMail } from '@/lib/email'
import { unsubscribeUrl } from '@/lib/unsubscribe'

const userIdsOf = (recipients: Recipient[]) =>
  recipients.flatMap(recipient => ('userId' in recipient ? [recipient.userId] : []))

const deliver = async <K extends EventType>(event: AppEvent<K>) => {
  const definition = EVENT_DEFINITIONS[event.type]
  const [inApp, emailTo] = await Promise.all([definition.inApp?.(event) ?? [], definition.email?.to(event) ?? []])
  const ids = [...new Set([...inApp, ...userIdsOf(emailTo)])]
  const people =
    ids.length > 0
      ? await db.query.users.findMany({
          columns: {
            banned: true,
            email: true,
            firstName: true,
            id: true,
            locale: true,
            notificationPreferences: true,
          },
          where: inArray(users.id, ids),
        })
      : []

  const plan = planNotifications({
    actorId: event.actorId,
    category: definition.email?.category ?? null,
    emailTo,
    fallbackLocale: 'locale' in event.data && typeof event.data.locale === 'string' ? event.data.locale : null,
    inApp,
    notifyActor: definition.notifyActor ?? false,
    people,
  })

  const url = definition.url?.(event) ?? null
  const data = eventMetadata(event)
  const variantOf = (userId: string) => {
    const variant = definition.variant?.(event, userId)
    return variant ? { ...data, variant } : data
  }
  const rows =
    plan.inAppIds.length > 0
      ? await db
          .insert(notifications)
          .values(plan.inAppIds.map(userId => ({ data: variantOf(userId), type: event.type, url, userId })))
          .returning({ id: notifications.id, userId: notifications.userId })
      : []

  const template = definition.email?.template
  const category = definition.email?.category ?? null
  const link = url ? `${process.env.APP_URL}${url}` : null
  if (plan.mails.length > 0 && !template) console.info(`[notify] ${event.type}: no email template yet`)
  const results = await Promise.all(
    plan.mails.map(async mail => {
      if (!template) return { sent: false, userId: mail.userId }
      try {
        await sendMail({
          category,
          locale: mail.locale,
          template: await template(event, mail, link),
          to: mail.email,
          unsubscribeUrl:
            category && category !== 'mandatory' && mail.userId ? unsubscribeUrl(mail.userId, category) : undefined,
        })
        return { sent: true, userId: mail.userId }
      } catch (error) {
        console.error(`[notify] ${event.type}: email failed`, error)
        return { sent: false, userId: mail.userId }
      }
    })
  )
  const sent = results.filter(result => result.sent)
  const sentUserIds = new Set(sent.map(({ userId }) => userId))

  const emailedIds = rows.flatMap(row => (sentUserIds.has(row.userId) ? [row.id] : []))
  if (emailedIds.length > 0) {
    await db
      .update(notifications)
      .set({ emailedAt: new Date().toISOString() })
      .where(inArray(notifications.id, emailedIds))
  }

  for (const userId of plan.inAppIds) revalidateTag(notificationsUserTag(userId), 'max')

  return { emailed: sent.length, inApp: rows.length }
}

export const notify = async <K extends EventType>(event: AppEvent<K>) => {
  try {
    return await deliver(event)
  } catch (error) {
    console.error(`[notify] ${event.type} failed`, error)
    return { emailed: 0, inApp: 0 }
  }
}
