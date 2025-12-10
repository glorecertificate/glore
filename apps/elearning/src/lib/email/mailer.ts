import { createElement } from 'react'

import { pretty, render, toPlainText } from '@react-email/render'
import { type MessageAttachment, SMTPClient } from 'emailjs'

import { i18n } from '@/lib/i18n'
import { emailConfig } from './config'
import type { EmailTemplate, EmailTemplateOptions } from './types'
import { getEmailTranslations } from './utils'

export const sendEmail = async <T extends EmailTemplate>(
  template: T,
  {
    attachments,
    from = process.env.EMAIL_SENDER,
    locale = i18n.defaultLocale,
    preview,
    smtp,
    subject,
    to,
    ...options
  }: EmailTemplateOptions<T>
) => {
  const client = new SMTPClient({ ...emailConfig.smtp, ...smtp })
  const component = (await import(`@/components/email/templates/${template}`)).default
  const t = await getEmailTranslations(`Email.${template}`, locale)

  const sender = from ?? process.env.EMAIL_SENDER
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
  } satisfies EmailTemplateOptions<T>

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
