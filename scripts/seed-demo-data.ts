import { parseArgs } from 'node:util'

import { LOCAL_DATABASE_REGEX, type MembershipRole } from './seed-data.ts'
import { type DemoLocale } from './seed-demo-copy.ts'

const DEMO_TARGETS = ['local', 'staging'] as const

export type DemoTarget = (typeof DEMO_TARGETS)[number]

export const STAGING_COMMENT = 'glore:staging'

export const DEMO_USAGE = 'Usage: pnpm run db:seed:demo --target <local|staging>'

export const DAY_MS = 86_400_000

export const ago = (now: Date, days: number) => new Date(now.getTime() - days * DAY_MS).toISOString()

export interface DemoOrganization {
  key: string
  handle: string
  name: string
  city: string
  country: string
  approved: boolean
  legalName: string
  registryId: string
  legalRepresentative: string
  url: string
  phone: string
  address: string
  postcode: string
  region: string
  volunteersPerYear: number
  createdDaysAgo: number
}

export const DEMO_ORGANIZATIONS: DemoOrganization[] = [
  {
    key: 'ponte',
    handle: 'ponte-volunteers-demo',
    name: 'Ponte Volunteers (Demo)',
    city: 'Milan',
    country: 'IT',
    approved: true,
    legalName: 'Ponte Volontari APS',
    registryId: '97812340153',
    legalRepresentative: 'Olivia Conti',
    url: 'https://ponte-volunteers.example.org',
    phone: '+39 02 5550 0142',
    address: 'Via Giovanni Tadino 32',
    postcode: '20124',
    region: 'Lombardia',
    volunteersPerYear: 120,
    createdDaysAgo: 300,
  },
  {
    key: 'red',
    handle: 'red-solidaria-demo',
    name: 'Red Solidaria (Demo)',
    city: 'Valencia',
    country: 'ES',
    approved: true,
    legalName: 'Asociación Red Solidaria Valencia',
    registryId: 'G98765432',
    legalRepresentative: 'Lucía Navarro',
    url: 'https://red-solidaria.example.org',
    phone: '+34 960 555 018',
    address: 'Carrer de Cuba 21',
    postcode: '46006',
    region: 'Comunitat Valenciana',
    volunteersPerYear: 80,
    createdDaysAgo: 220,
  },
  {
    key: 'open-doors',
    handle: 'open-doors-collective-demo',
    name: 'Open Doors Collective (Demo)',
    city: 'Lisbon',
    country: 'PT',
    approved: false,
    legalName: 'Open Doors Collective Associação',
    registryId: 'PT514872309',
    legalRepresentative: 'Inês Carvalho',
    url: 'https://open-doors.example.org',
    phone: '+351 21 555 0173',
    address: 'Rua da Madalena 87',
    postcode: '1100-319',
    region: 'Lisboa',
    volunteersPerYear: 60,
    createdDaysAgo: 1,
  },
]

export const APPLICANT = { firstName: 'Inês', lastName: 'Carvalho', locale: 'en' } as const

interface DemoProfile {
  birthday: string
  birthPlace: string | null
  nationality: string | null
  country: string
  city: string
  languages: string[]
  bio?: string
}

export interface DemoUser {
  key: string
  firstName: string
  lastName: string
  locale: DemoLocale
  platformRole?: 'admin'
  isEditor?: boolean
  publicProfile?: boolean
  background?: boolean
  joinedDaysAgo: number
  profile: DemoProfile
  memberships: Partial<Record<string, MembershipRole>>
}

interface PersonExtra {
  locale: DemoLocale
  joinedDaysAgo: number
  profile: DemoProfile
  memberships?: DemoUser['memberships']
  platformRole?: 'admin'
  isEditor?: boolean
  publicProfile?: boolean
  background?: boolean
}

const milan = (birthday: string, languages = ['it', 'en']): DemoProfile => ({
  birthday,
  birthPlace: 'Milan',
  nationality: 'IT',
  city: 'Milan',
  country: 'IT',
  languages,
})

const valencia = (birthday: string, birthPlace: string, languages = ['es', 'en']): DemoProfile => ({
  birthday,
  birthPlace,
  nationality: 'ES',
  city: 'Valencia',
  country: 'ES',
  languages,
})

const person = (key: string, name: string, extra: PersonExtra): DemoUser => {
  const [firstName = name, lastName = ''] = name.split(' ')
  return { key, firstName, lastName, memberships: {}, ...extra }
}

const member = (
  key: string,
  name: string,
  extra: Omit<PersonExtra, 'background'> & { organization?: string; role?: MembershipRole }
) => {
  const { organization = 'ponte', role = 'volunteer', ...rest } = extra
  return person(key, name, { ...rest, memberships: { [organization]: role }, background: true })
}

export const DEMO_USERS: DemoUser[] = [
  person('admin', 'Ada Rossi', {
    locale: 'en',
    joinedDaysAgo: 300,
    platformRole: 'admin',
    profile: { ...milan('1985-06-02'), birthPlace: 'Rome', city: 'Rome' },
  }),
  person('editor', 'Edith Bianchi', {
    locale: 'en',
    joinedDaysAgo: 290,
    isEditor: true,
    profile: { ...milan('1988-11-19'), birthPlace: 'Turin', city: 'Turin' },
  }),
  person('owner', 'Olivia Conti', {
    locale: 'en',
    joinedDaysAgo: 295,
    profile: milan('1984-03-12'),
    memberships: { ponte: 'admin' },
  }),
  person('rep', 'Rafael Moretti', {
    locale: 'it',
    joinedDaysAgo: 160,
    profile: milan('1990-09-23'),
    memberships: { ponte: 'representative' },
  }),
  person('tutor', 'Tomas Ricci', {
    locale: 'en',
    joinedDaysAgo: 150,
    profile: milan('1987-01-30'),
    memberships: { ponte: 'tutor' },
  }),
  person('tutor2', 'Teresa Galli', {
    locale: 'it',
    joinedDaysAgo: 150,
    profile: milan('1991-04-08'),
    memberships: { ponte: 'tutor' },
  }),
  person('volunteer', 'Valentina Greco', {
    locale: 'en',
    joinedDaysAgo: 200,
    publicProfile: true,
    profile: {
      ...milan('1998-05-14'),
      bio: 'Volunteering at a food bank in Milan since last spring. I enjoy organising people and cooking for big groups.',
    },
    memberships: { ponte: 'volunteer' },
  }),
  person('volunteer-progress', 'Paolo Marino', {
    locale: 'it',
    joinedDaysAgo: 60,
    profile: { ...milan('1999-02-17'), birthPlace: null, nationality: null },
    memberships: { ponte: 'volunteer' },
  }),
  person('volunteer-review', 'Sara Lombardi', {
    locale: 'it',
    joinedDaysAgo: 120,
    profile: milan('1997-08-03'),
    memberships: { ponte: 'volunteer' },
  }),
  person('volunteer-changes', 'Marco Fontana', {
    locale: 'it',
    joinedDaysAgo: 110,
    profile: milan('1996-12-21'),
    memberships: { ponte: 'volunteer' },
  }),
  person('learner', 'Leo Costa', {
    locale: 'en',
    joinedDaysAgo: 45,
    profile: milan('2001-07-09'),
    memberships: { ponte: 'learner' },
  }),
  person('multi', 'Martina Ferrari', {
    locale: 'es',
    joinedDaysAgo: 140,
    profile: { ...valencia('1993-10-05', 'Bologna', ['it', 'es', 'en']), nationality: 'IT' },
    memberships: { ponte: 'volunteer', red: 'tutor' },
  }),
  person('owner-b', 'Lucía Navarro', {
    locale: 'es',
    joinedDaysAgo: 215,
    profile: valencia('1986-02-27', 'Valencia'),
    memberships: { red: 'admin' },
  }),
  member('member-01', 'Giulia Esposito', { locale: 'it', joinedDaysAgo: 130, profile: milan('1999-03-11') }),
  member('member-02', 'Luca Barbieri', { locale: 'it', joinedDaysAgo: 125, profile: milan('2000-06-25') }),
  member('member-03', 'Chiara Serra', { locale: 'it', joinedDaysAgo: 180, profile: milan('1998-09-14') }),
  member('member-04', 'Matteo Villa', { locale: 'en', joinedDaysAgo: 100, profile: milan('1997-01-06') }),
  member('member-05', 'Elena Gatti', { locale: 'it', joinedDaysAgo: 95, profile: milan('2002-10-30') }),
  member('member-06', 'Federico Ferri', { locale: 'it', joinedDaysAgo: 210, profile: milan('1995-12-02') }),
  member('member-07', 'Alessia Rinaldi', { locale: 'en', joinedDaysAgo: 240, profile: milan('1996-05-19') }),
  member('member-08', 'Davide Caruso', { locale: 'it', joinedDaysAgo: 260, profile: milan('1994-08-08') }),
  member('member-09', 'Noemi Pagano', { locale: 'it', joinedDaysAgo: 90, profile: milan('2000-02-12') }),
  member('member-10', 'Simone Leone', { locale: 'it', joinedDaysAgo: 200, profile: milan('1997-11-27') }),
  member('member-11', 'Anna Silva', {
    locale: 'en',
    joinedDaysAgo: 70,
    role: 'learner',
    profile: {
      birthday: '2000-04-16',
      birthPlace: 'Recife',
      nationality: 'BR',
      city: 'Milan',
      country: 'IT',
      languages: ['pt', 'it', 'en'],
    },
  }),
  member('member-12', 'Ivan Kovac', {
    locale: 'en',
    joinedDaysAgo: 85,
    profile: {
      birthday: '1999-07-22',
      birthPlace: 'Zagreb',
      nationality: 'HR',
      city: 'Milan',
      country: 'IT',
      languages: ['hr', 'en'],
    },
  }),
  member('red-01', 'Carmen Ruiz', {
    locale: 'es',
    joinedDaysAgo: 150,
    organization: 'red',
    profile: valencia('1999-01-18', 'Valencia'),
  }),
  member('red-02', 'Javier Molina', {
    locale: 'es',
    joinedDaysAgo: 140,
    organization: 'red',
    profile: valencia('1998-06-03', 'Alicante', ['es']),
  }),
  member('red-03', 'Pablo Ortega', {
    locale: 'es',
    joinedDaysAgo: 60,
    organization: 'red',
    profile: valencia('2000-09-09', 'Valencia'),
  }),
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
