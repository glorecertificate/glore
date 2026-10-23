const NOTIFICATION_CATEGORIES = ['learning', 'organization', 'reminders'] as const

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number]

export const notificationCategoriesFor = (hasOrganizations: boolean) =>
  NOTIFICATION_CATEGORIES.filter(category => hasOrganizations || category !== 'organization')
