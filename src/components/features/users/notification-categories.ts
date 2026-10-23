const NOTIFICATION_CATEGORIES = ['learning', 'organization', 'reminders'] as const

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number]

const ORGANIZATION_MANAGER_ROLES: readonly string[] = ['admin', 'representative']

export const notificationCategoriesFor = (roles: readonly string[]) => {
  const managesOrganization = roles.some(role => ORGANIZATION_MANAGER_ROLES.includes(role))
  return NOTIFICATION_CATEGORIES.filter(category => managesOrganization || category !== 'organization')
}
