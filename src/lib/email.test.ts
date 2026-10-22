import { readdirSync } from 'node:fs'

import { type ComponentType } from 'react'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LOCALES } from '@/lib/i18n'

const transport = vi.hoisted(() => ({ sendMail: vi.fn(() => Promise.resolve({})) }))

vi.mock('nodemailer', () => ({ createTransport: () => transport }))
vi.mock('@/db/client', () => ({ db: {} }))

interface TemplateModule {
  default: ComponentType<never> & { PreviewProps?: Record<string, unknown> }
}

const EMAILS_DIR = new URL('../emails/', import.meta.url)

const files = readdirSync(EMAILS_DIR, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .flatMap(entry =>
    readdirSync(new URL(`${entry.name}/`, EMAILS_DIR)).map(file => ({
      directory: entry.name,
      file: file.replace('.tsx', ''),
    }))
  )

const modules = await Promise.all(
  files.map(async ({ directory, file }) => ({
    module: (await import(`../emails/${directory}/${file}.tsx`)) as TemplateModule,
    name: `${directory}/${file}`,
  }))
)

const templates = modules.map(({ module, name }) => ({ name, props: module.default.PreviewProps ?? {} }))

describe('email templates', () => {
  beforeEach(() => {
    transport.sendMail.mockClear()
    vi.stubEnv('APP_URL', 'https://glore.test')
  })

  it('gives every template preview props for the email preview server', () => {
    expect(templates.length).toBeGreaterThanOrEqual(19)
    for (const { module, name } of modules) {
      expect(module.default.PreviewProps, name).toBeDefined()
    }
  })

  for (const locale of LOCALES) {
    it(`renders every template in ${locale} with a subject and no missing copy`, async () => {
      const { sendMail } = await import('@/lib/email')

      for (const { name, props } of templates) {
        transport.sendMail.mockClear()
        await sendMail({
          locale,
          template: { name, props } as Parameters<typeof sendMail>[0]['template'],
          to: 'person@example.org',
        })
        const [message] = transport.sendMail.mock.calls[0] as unknown as [
          { html: string; subject: string; text: string },
        ]

        expect(message.subject, `${locale} ${name} subject`).toBeTruthy()
        expect(message.subject, `${locale} ${name} subject`).not.toMatch(/Email\.|[{}]/u)
        expect(message.html, `${locale} ${name} html`).not.toMatch(/Email\.[a-z/-]+|\{[a-zA-Z]+\}/u)
        expect(message.html, `${locale} ${name} html`).toContain('/email/header.png')
      }
    })
  }

  it('states the reason and the preference link on optional mail only', async () => {
    const { sendMail } = await import('@/lib/email')
    const template = templates.find(({ name }) => name === 'certificate/reminder')
    if (!template) throw new Error('missing template')
    const send = async (category: 'mandatory' | 'reminders' | null) => {
      transport.sendMail.mockClear()
      await sendMail({
        category,
        locale: 'en',
        template: { name: 'certificate/reminder', props: template.props } as Parameters<typeof sendMail>[0]['template'],
        to: 'person@example.org',
        unsubscribeUrl: category === 'reminders' ? 'https://glore.test/api/v1/mail-preferences?token=abc' : undefined,
      })
      const [message] = transport.sendMail.mock.calls[0] as unknown as [
        { headers?: Record<string, string>; html: string },
      ]
      return message
    }

    const optional = await send('reminders')
    expect(optional.html).toContain('/settings?tab=notifications')
    expect(optional.headers).toEqual({
      'List-Unsubscribe': '<https://glore.test/api/v1/mail-preferences?token=abc>',
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    })

    const mandatory = await send('mandatory')
    expect(mandatory.html).not.toContain('/settings?tab=notifications')
    expect(mandatory.html).toContain('service email')
    expect(mandatory.headers).toBeUndefined()
  })
})
