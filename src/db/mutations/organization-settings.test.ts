import { randomUUID } from 'node:crypto'

import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { mergeDescription } from '@/db/queries/organization'
import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

vi.mock('@/actions/notifications/notify', () => ({ notify: vi.fn() }))

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

describe('mergeDescription', () => {
  it('keeps untouched locales and replaces patched ones', () => {
    expect(mergeDescription({ en: 'Hello', it: 'Ciao' }, { it: 'Salve' })).toEqual({ en: 'Hello', it: 'Salve' })
  })

  it('adds a new locale next to the existing ones', () => {
    expect(mergeDescription({ en: 'Hello' }, { es: 'Hola' })).toEqual({ en: 'Hello', es: 'Hola' })
  })

  it('drops a locale cleared with a blank value', () => {
    expect(mergeDescription({ en: 'Hello', it: 'Ciao' }, { it: '  ' })).toEqual({ en: 'Hello' })
  })

  it('returns null when no locale is left', () => {
    expect(mergeDescription({ en: 'Hello' }, { en: '' })).toBeNull()
    expect(mergeDescription(null, {})).toBeNull()
  })
})

describe.skipIf(!isLocalDatabase)('updateOrganization', () => {
  const suffix = randomUUID().slice(0, 8)
  let context: {
    client: typeof import('@/db/client')
    mutations: typeof import('@/db/mutations/organization')
    schema: typeof import('@/db/schema')
    organizationId: number
  }

  const base = {
    address: null,
    city: 'Milan',
    country: 'it',
    descriptionPatch: {},
    email: `org-${suffix}@settings.test`,
    legalName: null,
    legalRepresentative: null,
    name: 'Settings Test',
    phone: null,
    postcode: null,
    region: null,
    registryId: null,
    url: null,
  }

  const profile = async () =>
    await context.client.db.query.organizationProfiles.findFirst({
      where: eq(context.schema.organizationProfiles.organizationId, context.organizationId),
    })

  beforeAll(async () => {
    const [client, mutations, schema] = await Promise.all([
      import('@/db/client'),
      import('@/db/mutations/organization'),
      import('@/db/schema'),
    ])
    const [organization] = await client.db
      .insert(schema.organizations)
      .values({
        approvedAt: new Date().toISOString(),
        city: 'Milan',
        email: `org-${suffix}@settings.test`,
        handle: `settings-test-${suffix}`,
        name: 'Settings Test',
      })
      .returning({ id: schema.organizations.id })
    if (!organization) throw new Error('Failed to create the test organization')
    context = { client, mutations, organizationId: organization.id, schema }
  })

  afterAll(async () => {
    const { client, organizationId, schema } = context
    await client.db.delete(schema.organizations).where(eq(schema.organizations.id, organizationId))
  })

  it('persists the legal identity and signatory', async () => {
    await context.client.transaction(tx =>
      context.mutations.updateOrganization(tx, context.organizationId, {
        ...base,
        legalName: 'Settings Test APS',
        legalRepresentative: 'Maria Rossi',
        registryId: 'IT-123',
      })
    )
    const saved = await profile()
    expect(saved?.legalName).toBe('Settings Test APS')
    expect(saved?.legalRepresentative).toBe('Maria Rossi')
    expect(saved?.registryId).toBe('IT-123')
  })

  it('only touches the patched description locales', async () => {
    await context.client.transaction(tx =>
      context.mutations.updateOrganization(tx, context.organizationId, {
        ...base,
        descriptionPatch: { en: 'English text', it: 'Testo italiano' },
      })
    )
    await context.client.transaction(tx =>
      context.mutations.updateOrganization(tx, context.organizationId, {
        ...base,
        descriptionPatch: { it: 'Testo nuovo' },
      })
    )
    expect((await profile())?.description).toEqual({ en: 'English text', it: 'Testo nuovo' })
  })

  it('clears a locale with a blank patch', async () => {
    await context.client.transaction(tx =>
      context.mutations.updateOrganization(tx, context.organizationId, { ...base, descriptionPatch: { en: '' } })
    )
    expect((await profile())?.description).toEqual({ it: 'Testo nuovo' })
  })
})
