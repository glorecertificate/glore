import 'server-only'

import { createElement } from 'react'

import { pretty, render, toPlainText } from '@react-email/render'
import { type MessageAttachment, SMTPClient } from 'emailjs'

import { mailer } from '@/email/config'
import { type EmailTemplate, type EmailTemplateOptions } from '@/email/types'
import { getEmailTranslations } from '@/email/utils'
import { i18n } from '@/lib/i18n'

export const sendEmail = async <T extends EmailTemplate>(
  template: T,
  {
    attachments,
    from = process.env.SMTP_SENDER,
    locale = i18n.defaultLocale,
    preview,
    smtp,
    subject,
    to,
    ...options
  }: EmailTemplateOptions<T>
) => {
  const client = new SMTPClient({ ...mailer.smtp, ...smtp })
  const component = (await import(`@/email/templates/${template}`)).default
  const t = await getEmailTranslations(`Email.${template}`, locale)

  const sender = from ?? process.env.SMTP_SENDER
  if (!sender) throw new Error('Missing email sender.')

  // @ts-expect-error
  const [emailSubject, emailPreview] = [subject ?? t('subject'), preview ?? t('preview')] as const
  const props = {
    from: sender,
    locale,
    preview: emailPreview,
    subject: emailSubject,
    to,
    ...options,
  }

  const html = await pretty(await render(createElement(component, props)))
  const text = toPlainText(html)
  const attachment = [
    ...(attachments ?? []),
    {
      alternative: true,
      data: html,
    },
  ] satisfies MessageAttachment[]

  return await client.sendAsync({ from: sender, to, subject: emailSubject, text, attachment })
}
