export enum CacheTag {
  AuthUser = 'auth-user',
  Course = 'course',
  Courses = 'courses',
  SkillGroups = 'skill-groups',
  TeamMembers = 'team-members',
  User = 'user',
  UserEmail = 'user-email',
}

export type Theme = 'system' | 'light' | 'dark'
export type ResolvedTheme = Exclude<Theme, 'system'>

export type Icon<T = {}> = (props: React.SVGProps<SVGSVGElement> & T) => React.ReactNode
