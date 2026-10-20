type MembershipRole = 'admin' | 'learner' | 'representative' | 'tutor' | 'volunteer'

export interface SeedUser {
  key: string
  firstName: string
  platformRole?: 'admin'
  isEditor?: boolean
  membership?: MembershipRole
}

export const SEED_PASSWORD = 'Glore-Seed-2026'
const SEED_DOMAIN = 'seed.glore.test'
export const SEED_ORG_HANDLE = 'glore-seed'

export const SEED_USERS: SeedUser[] = [
  { key: 'admin', firstName: 'Ada', platformRole: 'admin' },
  { key: 'editor', firstName: 'Edith', isEditor: true },
  { key: 'owner', firstName: 'Olivia', membership: 'admin' },
  { key: 'representative', firstName: 'Rafael', membership: 'representative' },
  { key: 'tutor', firstName: 'Tomas', membership: 'tutor' },
  { key: 'volunteer', firstName: 'Valentina', membership: 'volunteer' },
  { key: 'learner', firstName: 'Leo', membership: 'learner' },
  { key: 'recovery', firstName: 'Rita', membership: 'learner' },
]

export const seedEmail = (key: string) => `${key}@${SEED_DOMAIN}`
