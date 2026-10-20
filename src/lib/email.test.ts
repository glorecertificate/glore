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
