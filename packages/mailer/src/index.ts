import '@glore/env/mail'

import { createElement } from 'react'

import { pretty, render, toPlainText } from '@react-email/render'
import { SMTPClient, type MessageAttachment } from 'emailjs'

import { createFormatter, getMessages, i18n } from '@glore/i18n'

import { mailer } from './config'
import { type EmailProps, type EmailTemplate, type MailerOptions, type SendEmailOptions } from './types'
import { importAsync } from './utils'

export class Mailer {
  private client: SMTPClient

  constructor(options: MailerOptions = {}) {
    this.setOptions(options, true)
    this.client = new SMTPClient(this.getClientOptions())
  }

  get options() {
    return this.options
  }

  set options(options: MailerOptions) {
    this.setOptions(options)
  }

  async sendEmail<T extends EmailTemplate>(template: T, options: SendEmailOptions<T>) {
    const from = options.from ?? this.options.from ?? mailer.sender

    const Template = await importAsync<React.ComponentType<EmailProps<T>>>(`@/templates/${template}`)
    const { locale = i18n.defaultLocale, to, ...opts } = { ...this.options, ...options }
    const messages = (await getMessages(locale)).Email
    const t = { common: messages.common, ...messages[template] }
    const f = createFormatter(locale)

    const subject = opts.subject ?? t.subject
    const props = { ...opts, f, from, locale, subject, t, to }
    props.preview = opts.preview ?? toPlainText(await render(createElement(Template, props))) ?? subject

    const html = await pretty(await render(createElement(Template, props)))
    const attachment = [...(props.attachments ?? []), { alternative: true, data: html }] as MessageAttachment[]

    return await this.client.sendAsync({
      from,
      to,
      subject,
      text: toPlainText(html),
      attachment,
    })
  }

  private setOptions(options: MailerOptions, init = false) {
    const { from = mailer.sender, locale = i18n.defaultLocale, ...opts } = { ...options, ...mailer.smtp }
    this.options = { ...opts, from, locale }
    if (!init) this.client = new SMTPClient(this.getClientOptions())
  }

  private getClientOptions() {
    const { footer, head, locale, logo, tailwindConfig, ...clientOpts } = this.options
    return clientOpts
  }
}

export * from './config'
export type * from './types'
