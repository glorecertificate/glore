import { describe, expect, it, vi } from 'vitest'

const loadStorage = async () => {
  vi.stubEnv('DATABASE_URL', 'postgresql://glore:glore@localhost:5433/glore')
  vi.resetModules()
  return await import('@/lib/storage')
}

describe('selectOrphanKeys', () => {
  const cutoff = new Date('2026-10-19T00:00:00Z')
  const old = new Date('2026-10-01T00:00:00Z')
  const fresh = new Date('2026-10-19T12:00:00Z')

  it('returns old objects that no stored URL references', async () => {
    const { selectOrphanKeys } = await loadStorage()
    const objects = [
      { key: 'avatars/u1-1.webp', lastModified: old },
      { key: 'avatars/u1-2.webp', lastModified: old },
      { key: 'avatars/u2-1.webp', lastModified: fresh },
    ]

    expect(selectOrphanKeys(objects, ['https://cdn.example.org/avatars/u1-2.webp'], cutoff)).toEqual([
      'avatars/u1-1.webp',
    ])
  })

  it('matches by key suffix so a changed public host keeps referenced objects', async () => {
    const { selectOrphanKeys } = await loadStorage()
    const objects = [{ key: 'organizations/7-1.png', lastModified: old }]

    expect(selectOrphanKeys(objects, ['https://new-host.example.org/prefix/organizations/7-1.png'], cutoff)).toEqual([])
  })

  it('does not treat a key as referenced by a longer key with the same ending', async () => {
    const { selectOrphanKeys } = await loadStorage()
    const objects = [{ key: 'avatars/u1-1.webp', lastModified: old }]

    expect(selectOrphanKeys(objects, ['https://cdn.example.org/avatars/xavatars/u1-1.webp'], cutoff)).toEqual([
      'avatars/u1-1.webp',
    ])
  })
})
