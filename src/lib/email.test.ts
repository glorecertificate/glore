import { describe, expect, it, vi } from 'vitest'

describe('sendMail', () => {
  it('logs instead of sending when MAIL_TRANSPORT is log', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://glore:glore@localhost:5433/glore')
    vi.stubEnv('MAIL_TRANSPORT', 'log')
    vi.resetModules()
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const { sendMail } = await import('@/lib/email')

    await sendMail({
      locale: 'en',
      template: { name: 'auth/recovery', props: { url: 'https://glore.localhost/reset' } },
      to: 'sink@seed.glore.test',
    })

    expect(info).toHaveBeenCalledWith(expect.stringContaining('[mail] auth/recovery to sink@seed.glore.test'))
  })
})

const isMailpitUp = async () => {
  try {
    return (await fetch('http://localhost:8025/api/v1/info')).ok
  } catch {
    return false
  }
}

const mailpitUp = await isMailpitUp()

describe.skipIf(!mailpitUp)('sendMail with Mailpit', () => {
  it('delivers to the local Mailpit inbox when MAIL_TRANSPORT is mailpit', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://glore:glore@localhost:5433/glore')
    vi.stubEnv('MAIL_TRANSPORT', 'mailpit')
    vi.resetModules()
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const { sendMail } = await import('@/lib/email')
    const to = `mailpit-${Date.now()}@seed.glore.test`

    await sendMail({
      locale: 'en',
      template: { name: 'auth/recovery', props: { url: 'https://glore.localhost/reset' } },
      to,
    })

    const response = await fetch(`http://localhost:8025/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`)
    const { messages } = (await response.json()) as { messages: { Subject: string }[] }
    expect(messages).toHaveLength(1)
  })
})
