export enum CacheTag {
  AdminUsers = 'admin-users',
  Certificates = 'certificates',
  ContentTranslations = 'content-translations',
  Course = 'course',
  Courses = 'courses',
  DocCategories = 'doc-categories',
  Legal = 'legal',
  Messages = 'messages',
  Notifications = 'notifications',
  Organizations = 'organizations',
  Progress = 'progress',
  SkillGroups = 'skill-groups',
  TeamMembers = 'team-members',
  User = 'user',
  AdminOverview = 'admin-overview',
}

export const userTag = (id: string) => `${CacheTag.User}-${id}` as const
export const legalTag = (slug: string) => `${CacheTag.Legal}-${slug}` as const
export const courseTag = (slug: string) => `${CacheTag.Course}-${slug}` as const
export const certificatesUserTag = (userId: string) => `${CacheTag.Certificates}-user-${userId}` as const
export const certificatesTutorTag = (reviewerId: string) => `${CacheTag.Certificates}-tutor-${reviewerId}` as const
export const certificatesOrgTag = (orgId: number) => `${CacheTag.Certificates}-org-${orgId}` as const
export const progressUserTag = (userId: string) => `${CacheTag.Progress}-user-${userId}` as const
export const notificationsUserTag = (userId: string) => `${CacheTag.Notifications}-user-${userId}` as const
export const messagesTag = (locale: string) => `${CacheTag.Messages}-${locale}` as const
