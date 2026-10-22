import { useTranslations } from 'next-intl'

import { messageKey, messageValues, messageVariant, roleGroup } from '@/components/features/notifications/utils'
import { type Notification } from '@/db/queries/notification'

type Translate = (key: string, values?: Record<string, number | string>) => string

export const useNotificationText = () => {
  const t = useTranslations('Notifications')
  const translate = t as unknown as Translate

  return ({ data, type }: Pick<Notification, 'data' | 'type'>) => {
    const variant = messageVariant(type, data)
    const base = `events.${messageKey(type)}${variant ? `_${variant}` : ''}`
    const values = messageValues(data)
    const roleKey = `${roleGroup(type)}.${values.role}`
    const role = t.has(roleKey as never) ? translate(roleKey) : values.role
    const params = { ...values, role }
    const hasMessage = t.has(`${base}.title` as never)

    return {
      body: t.has(`${base}.body` as never) ? translate(`${base}.body`, params) : null,
      title: hasMessage ? translate(`${base}.title`, params) : t('fallbackTitle'),
    }
  }
}
