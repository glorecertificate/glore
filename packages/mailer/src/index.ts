import '@glore/env/mail'

import { createElement } from 'react'

import { pretty, render, toPlainText } from '@react-email/render'
import { type MessageAttachment, SMTPClient } from 'emailjs'

import { getMessages, i18nConfig } from '@glore/i18n'

import { mailerConfig } from './config'
import { type EmailOptions, type EmailProps, type EmailTemplate } from './types'
import { createFormatter, importAsync } from './utils'

export const sendEmail = async <T extends EmailTemplate>(template: T, options: EmailOptions<T>) => {
  const { from = mailerConfig.sender, to, locale = i18nConfig.defaultLocale, smtp, ...emailProps } = options

  const client = new SMTPClient({ ...mailerConfig.smtp, ...smtp })
  const component = await importAsync<React.ComponentType<EmailProps<T>>>(`./templates/${template}`)

  const messages = (await getMessages(locale)).Email
  const t = { common: messages.common, ...messages[template] }
  const f = createFormatter(locale)

  const subject = options.subject ?? t.subject
  const props = { from, to, locale, subject, f, t, ...emailProps }
  const preview = options.preview ?? toPlainText(await render(createElement(component, props))) ?? subject

  const html = await pretty(await render(createElement(component, { ...props, preview })))
  const text = toPlainText(html)
  const attachment = [
    ...(options.attachments ?? []),
    {
      alternative: true,
      data: html,
    },
  ] as MessageAttachment[]

  return await client.sendAsync({ from, to, subject, text, attachment })
}

export * from './config'
export type * from './types'
