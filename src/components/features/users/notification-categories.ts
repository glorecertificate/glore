const NOTIFICATION_CATEGORIES = ['learning', 'organization', 'reminders'] as const

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number]

const ORGANIZATION_MANAGER_ROLES: readonly string[] = ['admin', 'representative']

export const notificationCategoriesFor = ({
  certificates,
  roles,
}: {
  certificates: boolean
  roles: readonly string[]
}) => {
  const managesOrganization = roles.some(role => ORGANIZATION_MANAGER_ROLES.includes(role))
  return NOTIFICATION_CATEGORIES.filter(category => {
    if (category === 'organization') return managesOrganization
    if (category === 'learning') return certificates
    return true
  })
}
