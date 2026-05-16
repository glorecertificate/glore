export enum CacheTag {
  AdminUsers = 'admin-users',
  AuthUser = 'auth-user',
  AuthUserStatus = 'auth-user-status',
  Certificates = 'certificates',
  Course = 'course',
  Courses = 'courses',
  DocCategories = 'doc-categories',
  Organizations = 'organizations',
  SkillGroups = 'skill-groups',
  TeamMembers = 'team-members',
  User = 'user',
  UserEmail = 'user-email',
}

export const userTag = (id: string) => `${CacheTag.User}-${id}` as const
export const courseTag = (slug: string) => `${CacheTag.Course}-${slug}` as const
export const certificatesUserTag = (userId: string) => `${CacheTag.Certificates}-user-${userId}` as const
export const certificatesTutorTag = (reviewerId: string) => `${CacheTag.Certificates}-tutor-${reviewerId}` as const
export const certificatesOrgTag = (orgId: number) => `${CacheTag.Certificates}-org-${orgId}` as const
