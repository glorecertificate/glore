'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { updateNotificationPreferences } from '@/actions/account/preferences'
import {
  type NotificationCategory,
  notificationCategoriesFor,
} from '@/components/features/users/notification-categories'
import { SettingsSection } from '@/components/features/users/settings-section'
import { useSession } from '@/components/providers/session'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export const NotificationsForm = () => {
  const { setUser, user } = useSession()
  const t = useTranslations('Users')
  const [saving, setSaving] = useState<string | null>(null)

  const handleChange = async (category: NotificationCategory, enabled: boolean) => {
    setSaving(category)
    const { error } = await updateNotificationPreferences({ [category]: enabled })
    setSaving(null)
    if (error) {
      toast.error(t('notificationsError'))
      return
    }
    setUser(current => ({
      ...current,
      notificationPreferences: { ...current.notificationPreferences, [category]: enabled },
    }))
    toast.success(t('notificationsSaved'))
  }

  return (
    <SettingsSection description={t('notificationsDescription')} title={t('notificationsEmail')}>
      <ul className="divide-y rounded-lg border px-4">
        {notificationCategoriesFor(user.organizations.map(({ role }) => role)).map(category => (
          <li className="flex items-start justify-between gap-4 py-4" key={category}>
            <div className="space-y-1">
              <Label htmlFor={`notifications-${category}`}>{t(`notificationsCategory_${category}`)}</Label>
              <p className="text-sm text-muted-foreground">{t(`notificationsCategory_${category}_description`)}</p>
            </div>
            <Switch
              checked={user.notificationPreferences[category] !== false}
              disabled={saving === category}
              id={`notifications-${category}`}
              onCheckedChange={enabled => handleChange(category, enabled)}
            />
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">{t('notificationsMandatory')}</p>
    </SettingsSection>
  )
}
