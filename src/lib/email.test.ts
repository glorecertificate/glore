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
    }, 30_000)
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

describe('renderEmail', () => {
  beforeEach(() => {
    transport.sendMail.mockClear()
    vi.stubEnv('APP_URL', 'https://glore.test')
  })

  it('registers one preview template per email file', async () => {
    const { EMAIL_TEMPLATE_NAMES } = await import('@/lib/email')
    expect([...EMAIL_TEMPLATE_NAMES].sort()).toEqual(templates.map(({ name }) => name).sort())
  })

  it('previews every template with its PreviewProps in every locale', async () => {
    const { EMAIL_TEMPLATE_NAMES, previewTemplate, renderEmail } = await import('@/lib/email')

    for (const name of EMAIL_TEMPLATE_NAMES) {
      const template = previewTemplate(name)
      expect(template.props, name).toEqual(templates.find(entry => entry.name === name)?.props)
      for (const locale of LOCALES) {
        const { html, subject, text } = await renderEmail({ locale, template })
        expect(subject, `${locale} ${name}`).toBeTruthy()
        expect(subject, `${locale} ${name}`).not.toMatch(/Email\.|[{}]/u)
        expect(html, `${locale} ${name}`).toContain('<html')
        expect(text, `${locale} ${name}`).toBeTruthy()
      }
    }
  }, 60_000)

  it('renders what sendMail sends', async () => {
    const { previewTemplate, renderEmail, sendMail } = await import('@/lib/email')
    const template = previewTemplate('certificate/reminder')

    for (const locale of LOCALES) {
      transport.sendMail.mockClear()
      const rendered = await renderEmail({ category: 'reminders', locale, template })
      await sendMail({ category: 'reminders', locale, template, to: 'person@example.org' })
      const [message] = transport.sendMail.mock.calls[0] as unknown as [{ html: string; subject: string; text: string }]
      expect(message).toMatchObject(rendered)
    }
  })

  it('localizes the subject and follows the category', async () => {
    const { previewTemplate, renderEmail } = await import('@/lib/email')
    const template = previewTemplate('account/welcome')
    const english = await renderEmail({ locale: 'en', template })
    const italian = await renderEmail({ locale: 'it', template })
    const optional = await renderEmail({ category: 'reminders', locale: 'en', template })
    const mandatory = await renderEmail({ category: 'mandatory', locale: 'en', template })

    expect(italian.subject).not.toBe(english.subject)
    expect(mandatory.html).toContain('service email')
    expect(english.html).not.toContain('service email')
    expect(optional.html).toContain('/settings?tab=notifications')
    expect(english.html).not.toContain('/settings?tab=notifications')
  })

  it('words an organization approval as a registration, not a join request', async () => {
    const { renderEmail } = await import('@/lib/email')
    const approved = await renderEmail({
      locale: 'en',
      template: {
        name: 'organization/application-decision',
        props: { organizationName: 'Acme', status: 'approved', url: 'https://glore.test/join?token=x' },
      },
    })
    const rejected = await renderEmail({
      locale: 'en',
      template: { name: 'organization/application-decision', props: { organizationName: 'Acme', status: 'rejected' } },
    })

    expect(approved.subject).toBe('Your organization Acme was approved')
    expect(approved.subject).not.toMatch(/join/iu)
    expect(approved.html).toContain('Set up your account')
    expect(rejected.subject).toBe('Your registration of Acme was declined')
  })

  it('links the password change contact button to support, not the login page', async () => {
    const { previewTemplate, renderEmail } = await import('@/lib/email')
    const { html } = await renderEmail({ locale: 'en', template: previewTemplate('account/password-changed') })

    expect(html).toContain('href="mailto:info@glorecertificate.net"')
    expect(html).not.toContain('glore.test/login')
  })

  it('does not repeat the product name in membership copy', async () => {
    const { renderEmail } = await import('@/lib/email')
    const { text } = await renderEmail({
      locale: 'en',
      template: {
        name: 'organization/membership',
        props: { kind: 'role_changed', organizationName: 'Acme', role: 'tutor', url: 'https://glore.test' },
      },
    })

    expect(text).toContain('Your role in Acme is now')
    expect(text).not.toContain('on GloRe')
  })
})
