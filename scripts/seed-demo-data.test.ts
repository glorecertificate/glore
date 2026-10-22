import { describe, expect, it } from 'vitest'

import {
  DEMO_ORGANIZATIONS,
  DEMO_USERS,
  demoEmail,
  demoUsername,
  guardDemoTarget,
  parseDemoArgs,
} from './seed-demo-data'

const LOCAL_URL = 'postgresql://glore:pw@localhost:5433/glore'
const REMOTE_URL = 'postgresql://user:pw@ep-example.eu-central-1.aws.neon.tech/neondb'

describe('demoEmail', () => {
  it('derives a plus-address from TEST_EMAIL', () => {
    expect(demoEmail('name@example.org', 'volunteer')).toBe('name+glore-volunteer@example.org')
  })

  it('replaces an existing plus tag', () => {
    expect(demoEmail('name+inbox@example.org', 'owner-b')).toBe('name+glore-owner-b@example.org')
  })

  it('rejects a value that is not an email', () => {
    expect(() => demoEmail('example.org', 'admin')).toThrow()
  })
})

describe('demoUsername', () => {
  it('produces a valid username for hyphenated keys', () => {
    expect(demoUsername('volunteer-progress')).toBe('demo.volunteer.progress')
  })
})

describe('parseDemoArgs', () => {
  it('accepts local and staging', () => {
    expect(parseDemoArgs(['--target', 'local'])).toEqual({ target: 'local' })
    expect(parseDemoArgs(['--target', 'staging'])).toEqual({ target: 'staging' })
  })

  it('rejects production and a missing target', () => {
    expect(parseDemoArgs(['--target', 'production']).error).toBeDefined()
    expect(parseDemoArgs([]).error).toBeDefined()
  })
})

describe('guardDemoTarget', () => {
  it('needs TEST_EMAIL and DATABASE_URL', () => {
    expect(guardDemoTarget('local', undefined, 'name@example.org')).not.toBeNull()
    expect(guardDemoTarget('local', LOCAL_URL, undefined)).not.toBeNull()
  })

  it('matches the target to the database host', () => {
    expect(guardDemoTarget('local', LOCAL_URL, 'name@example.org')).toBeNull()
    expect(guardDemoTarget('local', REMOTE_URL, 'name@example.org')).not.toBeNull()
    expect(guardDemoTarget('staging', REMOTE_URL, 'name@example.org')).toBeNull()
    expect(guardDemoTarget('staging', LOCAL_URL, 'name@example.org')).not.toBeNull()
  })
})

describe('demo accounts', () => {
  it('use unique keys and known organizations', () => {
    const keys = DEMO_USERS.map(({ key }) => key)
    const organizations = new Set(DEMO_ORGANIZATIONS.map(({ key }) => key))
    expect(new Set(keys).size).toBe(keys.length)
    expect(DEMO_USERS.flatMap(({ memberships }) => Object.keys(memberships)).every(key => organizations.has(key))).toBe(
      true
    )
  })
})
