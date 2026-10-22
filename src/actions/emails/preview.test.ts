import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ user: { canEdit: false, id: 'u1', isAdmin: false } }))

vi.mock('nodemailer', () => ({ createTransport: () => ({ sendMail: vi.fn() }) }))
vi.mock('next/cache', () => ({ cacheTag: vi.fn(), revalidateTag: vi.fn(), updateTag: vi.fn() }))
vi.mock('@/lib/auth', () => ({ auth: { api: {} } }))
vi.mock('@/db/client', () => ({ db: { query: {} }, transaction: vi.fn() }))
vi.mock('@/actions/user', () => ({ getCurrentUser: vi.fn(() => Promise.resolve(state.user)) }))

const asViewer = (viewer: Partial<typeof state.user>) => {
  state.user = { canEdit: false, id: 'u1', isAdmin: false, ...viewer }
}

describe('loadEmailPreview', () => {
  beforeEach(() => {
    vi.stubEnv('APP_URL', 'https://glore.test')
    asViewer({})
  })

  it('renders the preview for an editor', async () => {
    asViewer({ canEdit: true })
    const { loadEmailPreview } = await import('@/actions/emails/preview')
    const { data, error } = await loadEmailPreview({ locale: 'it', template: 'account/welcome' })

    expect(error).toBeNull()
    expect(data?.name).toBe('account/welcome')
    expect(data?.subject).toBeTruthy()
    expect(data?.html).toContain('<html')
    expect(data?.templates.length).toBeGreaterThan(10)
  })

  it('renders the preview for a platform admin and falls back to the first template', async () => {
    asViewer({ canEdit: true, isAdmin: true })
    const { loadEmailPreview } = await import('@/actions/emails/preview')
    const { EMAIL_TEMPLATE_NAMES } = await import('@/lib/email')
    const { data } = await loadEmailPreview({ template: 'does/not-exist' })

    expect(data?.name).toBe(EMAIL_TEMPLATE_NAMES[0])
    expect(data?.html).toBeTruthy()
  })

  it('refuses members who cannot edit', async () => {
    const { loadEmailPreview } = await import('@/actions/emails/preview')

    expect(await loadEmailPreview({ template: 'account/welcome' })).toEqual({ data: null, error: 'Forbidden' })
  })
})

describe('admin data for editors', () => {
  beforeEach(() => asViewer({ canEdit: true }))

  it('refuses the team and user lists, which only platform admins load', async () => {
    const { getTeamMembers } = await import('@/actions/admin/team')
    const { getAdminUsers } = await import('@/actions/admin/users')

    expect(await getTeamMembers({ cache: false })).toEqual({ data: null, error: 'Forbidden' })
    expect(await getAdminUsers({ cache: false })).toEqual({ data: null, error: 'Forbidden' })
  })
})
