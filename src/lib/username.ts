import { AUTH_ROOT, DASHBOARD_ROOTS, LEGAL_ROOTS, ONBOARDING_ROOT } from '@/lib/constants'

const segment = (path: string) => path.replace(/^\//u, '')

const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  ...DASHBOARD_ROOTS.map(segment),
  ...LEGAL_ROOTS.map(segment),
  segment(AUTH_ROOT),
  segment(ONBOARDING_ROOT),
  'api',
  'favicon',
  'glore',
  'invite',
  'join',
  'manifest',
  'notifications',
  'offline',
  'robots',
  'sitemap',
  'sw',
  'verify',
])

export const isReservedUsername = (value: string) => RESERVED_USERNAMES.has(value.trim().toLowerCase())

const MIN_LENGTH = 3
const MAX_LENGTH = 30

const slug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/gu, '')

export const usernameBase = (firstName: string, lastName?: string | null) => {
  const base = [firstName, lastName ?? ''].map(slug).filter(Boolean).join('.').slice(0, MAX_LENGTH).replace(/\.$/u, '')
  if (base.length >= MIN_LENGTH) return base
  return `${base}user`
}

export const pickUsername = (base: string, taken: ReadonlySet<string>) => {
  const available = (candidate: string) => !(taken.has(candidate) || isReservedUsername(candidate))
  if (available(base)) return base

  let suffix = 2
  while (!available(`${base}${suffix}`)) suffix += 1
  return `${base}${suffix}`
}
