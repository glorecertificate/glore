import { createElement } from 'react'

import { pretty, render, toPlainText } from '@react-email/render'
import { type MessageAttachment, SMTPClient } from 'emailjs'
import { getTranslations } from 'next-intl/server'

import { DEFAULT_LOCALE } from '@/lib/intl'
import { SMTP_CONFIG } from './constants'
import { type EmailTemplate, type SendEmailOptions, type TemplateOptions } from './types'

export const sendEmail = async <T extends EmailTemplate>(template: T, options: SendEmailOptions<T>) => {
  const {
    from = process.env.EMAIL_SENDER,
    locale = DEFAULT_LOCALE,
    preview: emailPreview,
    smtp,
    subject: emailSubject,
    to,
    ...emailProps
  } = options

  const client = new SMTPClient({ ...SMTP_CONFIG, ...smtp })
  const component = (await import(`./templates/${template}`)).default
  const t = await getTranslations({ namespace: `Email.${template}`, locale })

  const sender = from ?? process.env.EMAIL_SENDER
  if (!sender) throw new Error('Missing email sender.')

  const recipients =
    to ??
    (() => {
      throw new Error('Missing email recipient.')
    })()

  // @ts-expect-error
  const [subject, preview] = [emailSubject ?? t('subject'), emailPreview ?? t('preview')] as const
  const props: TemplateOptions<T> = { from: sender, locale, preview, subject, to: recipients, ...emailProps }

  const html = await pretty(await render(createElement(component, props)))
  const text = toPlainText(html)
  const attachment = [
    ...(options.attachments ?? []),
    {
      alternative: true,
      data: html,
    },
  ] as MessageAttachment[]

  return await client.sendAsync({ from: sender, to: recipients, subject, text, attachment })
}
