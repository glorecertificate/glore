import { describe, expect, it, vi } from 'vitest'

import { previewTemplate, sendMail } from '@/lib/email'

const send = vi.hoisted(() => vi.fn((_mail: Record<string, unknown>) => Promise.resolve({})))

vi.mock('nodemailer', () => ({ createTransport: () => ({ sendMail: send }) }))
vi.mock('@/db/client', () => ({ db: {} }))
vi.mock('@/lib/messages', async () => {
  const { default: messages } = await import('~/messages/en.json')
  return { loadMessages: () => Promise.resolve(messages) }
})
vi.mock('@/lib/settings', async () => {
  const { DEFAULT_SETTINGS } = await import('@/lib/app-settings')
  return { loadSettings: () => Promise.resolve({ ...DEFAULT_SETTINGS, email: 'support@glore.test' }) }
})

describe('sendMail', () => {
  it('sets the contact email from the app settings as the reply-to address', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
    await sendMail({ locale: 'en', template: previewTemplate('auth/recovery'), to: 'volunteer@glore.test' })
    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0]?.[0]).toMatchObject({ replyTo: 'support@glore.test', to: 'volunteer@glore.test' })
  })
})
