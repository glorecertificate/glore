import { parseArgs } from 'node:util'

import { LOCAL_DATABASE_REGEX, type MembershipRole } from './seed-data.ts'

const DEMO_TARGETS = ['local', 'staging'] as const

export type DemoTarget = (typeof DEMO_TARGETS)[number]

export const STAGING_SETTING = 'glore.environment'

export const STAGING_MARKER = 'staging'

export const DEMO_USAGE = 'Usage: pnpm run db:seed:demo --target <local|staging>'

export interface DemoOrganization {
  key: string
  handle: string
  name: string
  city: string
  country: string
  approved: boolean
}

export interface DemoUser {
  key: string
  firstName: string
  lastName: string
  locale: 'en' | 'es' | 'it'
  platformRole?: 'admin'
  isEditor?: boolean
  memberships: Partial<Record<string, MembershipRole>>
}

export const DEMO_ORGANIZATIONS: DemoOrganization[] = [
  {
    key: 'ponte',
    handle: 'ponte-volunteers-demo',
    name: 'Ponte Volunteers (Demo)',
    city: 'Milan',
    country: 'IT',
    approved: true,
  },
  {
    key: 'red',
    handle: 'red-solidaria-demo',
    name: 'Red Solidaria (Demo)',
    city: 'Valencia',
    country: 'ES',
    approved: true,
  },
]

export const DEMO_USERS: DemoUser[] = [
  { key: 'admin', firstName: 'Ada', lastName: 'Rossi', locale: 'en', platformRole: 'admin', memberships: {} },
  { key: 'editor', firstName: 'Edith', lastName: 'Bianchi', locale: 'en', isEditor: true, memberships: {} },
  { key: 'owner', firstName: 'Olivia', lastName: 'Conti', locale: 'en', memberships: { ponte: 'admin' } },
  { key: 'rep', firstName: 'Rafael', lastName: 'Moretti', locale: 'en', memberships: { ponte: 'representative' } },
  { key: 'tutor', firstName: 'Tomas', lastName: 'Ricci', locale: 'en', memberships: { ponte: 'tutor' } },
  { key: 'tutor2', firstName: 'Teresa', lastName: 'Galli', locale: 'en', memberships: { ponte: 'tutor' } },
  { key: 'volunteer', firstName: 'Valentina', lastName: 'Greco', locale: 'en', memberships: { ponte: 'volunteer' } },
  {
    key: 'volunteer-progress',
    firstName: 'Paolo',
    lastName: 'Marino',
    locale: 'en',
    memberships: { ponte: 'volunteer' },
  },
  {
    key: 'volunteer-review',
    firstName: 'Sara',
    lastName: 'Lombardi',
    locale: 'en',
    memberships: { ponte: 'volunteer' },
  },
  {
    key: 'volunteer-changes',
    firstName: 'Marco',
    lastName: 'Fontana',
    locale: 'en',
    memberships: { ponte: 'volunteer' },
  },
  { key: 'learner', firstName: 'Leo', lastName: 'Costa', locale: 'en', memberships: { ponte: 'learner' } },
  {
    key: 'multi',
    firstName: 'Martina',
    lastName: 'Ferrari',
    locale: 'en',
    memberships: { ponte: 'volunteer', red: 'tutor' },
  },
  { key: 'owner-b', firstName: 'Lucia', lastName: 'Navarro', locale: 'es', memberships: { red: 'admin' } },
]

export const demoEmail = (testEmail: string, key: string) => {
  const at = testEmail.lastIndexOf('@')
  if (at < 1 || at === testEmail.length - 1) throw new Error('TEST_EMAIL must be an email address')
  const local = testEmail.slice(0, at).split('+')[0]
  return `${local}+glore-${key}@${testEmail.slice(at + 1)}`
}

export const demoUsername = (key: string) => `demo.${key.replaceAll('-', '.')}`

export const parseDemoArgs = (argv: string[]) => {
  try {
    const { values } = parseArgs({ args: argv, options: { target: { type: 'string' } }, strict: true })
    const target = DEMO_TARGETS.find(name => name === values.target)
    if (!target) return { error: `--target must be one of ${DEMO_TARGETS.join(', ')}` }
    return { target }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export const guardDemoTarget = (target: DemoTarget, databaseUrl: string | undefined, testEmail: string | undefined) => {
  if (!databaseUrl) return 'DATABASE_URL is not set.'
  if (!testEmail) return 'TEST_EMAIL is not set.'
  const isLocal = LOCAL_DATABASE_REGEX.test(databaseUrl)
  if (target === 'local' && !isLocal) return 'Refusing to seed: --target local needs a DATABASE_URL on localhost.'
  if (target === 'staging' && isLocal) return 'Refusing to seed: --target staging needs a remote DATABASE_URL.'
  return null
}
