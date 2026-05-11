import 'server-only'

import { createElement } from 'react'

import { type AbstractIntlMessages, type Locale, createTranslator } from 'next-intl'
import { createTransport } from 'nodemailer'
import { render } from 'react-email'

import AccountEmailChangedEmail from '@/emails/account/email-changed'
import AccountPasswordChangedEmail from '@/emails/account/password-changed'
import AuthInviteEmail from '@/emails/auth/invite'
import AuthRecoveryEmail from '@/emails/auth/recovery'
import AuthVerifyEmailEmail from '@/emails/auth/verify-email'
import CertificateAssignedEmail from '@/emails/certificate/assigned'
import CertificateReviewEmail from '@/emails/certificate/review'
import OrganizationJoinRequestEmail from '@/emails/organization/join-request'
import OrganizationMemberAddedEmail from '@/emails/organization/member-added'
import TeamInviteEmail from '@/emails/team/invite'
import defaultMessages from '~/messages/en.json'

type Messages = typeof defaultMessages

interface TemplatePropsMap {
  'account/email-changed': { oldEmail: string; newEmail: string; type: 'new' | 'old'; userName?: string }
  'account/password-changed': { userName?: string }
  'auth/invite': { url: string; userName?: string }
  'auth/recovery': { url: string; userName?: string }
  'auth/verify-email': { url: string; userName?: string }
  'certificate/assigned': Record<string, never>
  'certificate/review': {
    status: 'approved' | 'changes_requested'
    comment?: string
    documentUrl?: string
    userName?: string
  }
  'organization/join-request': {
    organizationName: string
    status: 'accepted' | 'pending' | 'rejected'
    comment?: string | null
    userName?: string
  }
  'organization/member-added': {
    organizationName: string
    inviterName: string
    role: string
    isNewUser?: boolean
    userName?: string
  }
  'team/invite': { url: string; inviteeName: string; role: 'admin' | 'editor'; userName?: string }
}

type TemplateName = keyof TemplatePropsMap
type EmailTemplate = { [K in TemplateName]: { name: K; props: TemplatePropsMap[K] } }[TemplateName]

const messagesFor = async (locale: string) => {
  if (locale === 'it') {
    const { default: messages } = await import('~/messages/it.json')
    return messages as unknown as Messages
  }
  if (locale === 'es') {
    const { default: messages } = await import('~/messages/es.json')
    return messages as unknown as Messages
  }
  return defaultMessages as Messages
}

const buildEmail = (template: EmailTemplate, messages: Messages, locale: Locale) => {
  const m = messages as AbstractIntlMessages

  switch (template.name) {
    case 'account/email-changed': {
      const t = createTranslator({ locale, messages, namespace: 'Email.account/email-changed' })
      return {
        subject: t('subject'),
        element: createElement(AccountEmailChangedEmail, { ...template.props, locale, messages: m }),
      }
    }
    case 'account/password-changed': {
      const t = createTranslator({ locale, messages, namespace: 'Email.account/password-changed' })
      return {
        subject: t('subject'),
        element: createElement(AccountPasswordChangedEmail, { ...template.props, locale, messages: m }),
      }
    }
    case 'auth/invite': {
      const t = createTranslator({ locale, messages, namespace: 'Email.auth/invite' })
      return {
        subject: t('subject'),
        element: createElement(AuthInviteEmail, { ...template.props, locale, messages: m }),
      }
    }
    case 'auth/recovery': {
      const t = createTranslator({ locale, messages, namespace: 'Email.auth/recovery' })
      return {
        subject: t('subject'),
        element: createElement(AuthRecoveryEmail, { ...template.props, locale, messages: m }),
      }
    }
    case 'auth/verify-email': {
      const t = createTranslator({ locale, messages, namespace: 'Email.auth/verify-email' })
      return {
        subject: t('subject'),
        element: createElement(AuthVerifyEmailEmail, { ...template.props, locale, messages: m }),
      }
    }
    case 'certificate/assigned': {
      const t = createTranslator({ locale, messages, namespace: 'Email.certificate/assigned' })
      return { subject: t('subject'), element: createElement(CertificateAssignedEmail, { locale, messages: m }) }
    }
    case 'certificate/review': {
      const t = createTranslator({ locale, messages, namespace: 'Email.certificate/review' })
      const subject = template.props.status === 'approved' ? t('subjectApproved') : t('subjectChanges')
      return { subject, element: createElement(CertificateReviewEmail, { ...template.props, locale, messages: m }) }
    }
    case 'organization/join-request': {
      const t = createTranslator({ locale, messages, namespace: 'Email.organization/join-request' })
      const { organizationName, status } = template.props
      const subject =
        status === 'pending'
          ? t('subjectPending', { organizationName })
          : status === 'accepted'
            ? t('subjectAccepted', { organizationName })
            : t('subjectRejected', { organizationName })
      return {
        subject,
        element: createElement(OrganizationJoinRequestEmail, { ...template.props, locale, messages: m }),
      }
    }
    case 'organization/member-added': {
      const t = createTranslator({ locale, messages, namespace: 'Email.organization/member-added' })
      const subject = t('subject', { organizationName: template.props.organizationName })
      return {
        subject,
        element: createElement(OrganizationMemberAddedEmail, { ...template.props, locale, messages: m }),
      }
    }
    case 'team/invite': {
      const t = createTranslator({ locale, messages, namespace: 'Email.team/invite' })
      return {
        subject: t('subject'),
        element: createElement(TeamInviteEmail, { ...template.props, locale, messages: m }),
      }
    }
  }
}

const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export const sendMail = async ({
  to,
  template,
  locale = 'en',
}: {
  to: string | string[]
  template: EmailTemplate
  locale?: string
}) => {
  const messages = await messagesFor(locale)
  const { subject, element } = buildEmail(template, messages, locale as Locale)
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })])
  await transporter.sendMail({
    from: process.env.SMTP_SENDER,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
    text,
  })
}
