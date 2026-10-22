import 'server-only'

import { type ComponentProps, type ComponentType, createElement } from 'react'

import { eq } from 'drizzle-orm'
import { type AbstractIntlMessages } from 'next-intl'
import { createTransport } from 'nodemailer'
import { render } from 'react-email'

import { db } from '@/db/client'
import { users } from '@/db/schema/users'
import AccountEmailChangedEmail from '@/emails/account/email-changed'
import AccountPasswordChangedEmail from '@/emails/account/password-changed'
import AccountStatusEmail from '@/emails/account/status'
import AccountWelcomeEmail from '@/emails/account/welcome'
import AuthInviteEmail from '@/emails/auth/invite'
import AuthRecoveryEmail from '@/emails/auth/recovery'
import AuthVerifyEmailEmail from '@/emails/auth/verify-email'
import CertificateAssignedEmail from '@/emails/certificate/assigned'
import CertificateDecisionEmail from '@/emails/certificate/decision'
import CertificateReminderEmail from '@/emails/certificate/reminder'
import CertificateReviewEmail from '@/emails/certificate/review'
import LearningEligibleEmail from '@/emails/learning/eligible'
import OrganizationInvitationEmail from '@/emails/organization/invitation'
import OrganizationJoinRequestEmail from '@/emails/organization/join-request'
import OrganizationJoinRequestReceivedEmail from '@/emails/organization/join-request-received'
import OrganizationMembershipEmail from '@/emails/organization/membership'
import OrganizationRegistrationRequestEmail from '@/emails/organization/registration-request'
import TeamInviteEmail from '@/emails/team/invite'
import TeamRoleChangedEmail from '@/emails/team/role-changed'
import { type EmailBaseProps, type EmailCategory, type EmailTranslator, emailTranslator } from '@/emails/translate'
import { DEFAULT_LOCALE } from '@/lib/i18n'
import defaultMessages from '~/messages/en.json'

type Messages = typeof defaultMessages

interface TemplateDefinition<P extends EmailBaseProps> {
  component: ComponentType<P>
  subject: (t: EmailTranslator, props: P) => string
}

const define = <P extends EmailBaseProps>(
  component: ComponentType<P>,
  subject: (t: EmailTranslator, props: P) => string
): TemplateDefinition<P> => ({ component, subject })

const JOIN_REQUEST_SUBJECTS = {
  accepted: 'subjectAccepted',
  pending: 'subjectPending',
  rejected: 'subjectRejected',
} as const

const TEMPLATES = {
  'account/email-changed': define(AccountEmailChangedEmail, t => t('subject')),
  'account/password-changed': define(AccountPasswordChangedEmail, t => t('subject')),
  'account/status': define(AccountStatusEmail, (t, { kind }) => t(`subject_${kind}`)),
  'account/welcome': define(AccountWelcomeEmail, t => t('subject')),
  'auth/invite': define(AuthInviteEmail, t => t('subject')),
  'auth/recovery': define(AuthRecoveryEmail, t => t('subject')),
  'auth/verify-email': define(AuthVerifyEmailEmail, t => t('subject')),
  'certificate/assigned': define(CertificateAssignedEmail, (t, { kind = 'assigned' }) => t(`subject_${kind}`)),
  'certificate/decision': define(CertificateDecisionEmail, (t, { kind }) => t(`subject_${kind}`)),
  'certificate/reminder': define(CertificateReminderEmail, (t, { days, kind }) => t(`subject_${kind}`, { days })),
  'certificate/review': define(CertificateReviewEmail, (t, { status }) =>
    status === 'approved' ? t('subjectApproved') : t('subjectChanges')
  ),
  'learning/eligible': define(LearningEligibleEmail, t => t('subject')),
  'organization/invitation': define(OrganizationInvitationEmail, (t, { kind, organizationName }) =>
    t(kind === 'reminder' ? 'subjectReminder' : 'subject', { organizationName })
  ),
  'organization/join-request': define(OrganizationJoinRequestEmail, (t, { organizationName, status }) =>
    t(JOIN_REQUEST_SUBJECTS[status], { organizationName })
  ),
  'organization/join-request-received': define(
    OrganizationJoinRequestReceivedEmail,
    (t, { organizationName, requesterName }) => t('subject', { organizationName, requesterName })
  ),
  'organization/membership': define(OrganizationMembershipEmail, (t, { kind, organizationName }) =>
    t(`subject_${kind}`, { organizationName })
  ),
  'organization/registration-request': define(OrganizationRegistrationRequestEmail, (t, { organizationName }) =>
    t('subject', { organizationName })
  ),
  'team/invite': define(TeamInviteEmail, t => t('subject')),
  'team/role-changed': define(TeamRoleChangedEmail, (t, { role }) => t(role ? 'subject_set' : 'subject_removed')),
}

type Templates = typeof TEMPLATES

type TemplateName = keyof Templates

type TemplateProps<K extends TemplateName> = Omit<ComponentProps<Templates[K]['component']>, keyof EmailBaseProps>

export type EmailTemplate = { [K in TemplateName]: { name: K; props: TemplateProps<K> } }[TemplateName]

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

interface BuildOptions {
  category: EmailCategory | null
  locale: string
  messages: Messages
  template: EmailTemplate
}

const buildEmail = ({ category, locale, messages, template }: BuildOptions) => {
  const { component, subject } = TEMPLATES[template.name] as unknown as TemplateDefinition<
    EmailBaseProps & Record<string, unknown>
  >
  const props = { ...template.props, category, locale, messages: messages as AbstractIntlMessages }

  return {
    element: createElement(component, props),
    subject: subject(emailTranslator(`Email.${template.name}`, props), props),
  }
}

const transports = {
  log: () => createTransport({ jsonTransport: true }),
  mailpit: () => createTransport({ host: 'localhost', port: 1025, secure: false }),
  smtp: () =>
    createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    }),
}

const mailTransport = process.env.NODE_ENV === 'production' ? 'smtp' : (process.env.MAIL_TRANSPORT ?? 'smtp')

const transporter = transports[mailTransport]()

const recipientLocale = async (to: string | string[]) => {
  if (Array.isArray(to)) return DEFAULT_LOCALE
  const recipient = await db.query.users.findFirst({
    columns: { locale: true },
    where: eq(users.email, to.trim().toLowerCase()),
  })
  return recipient?.locale ?? DEFAULT_LOCALE
}

interface SendMailOptions {
  to: string | string[]
  template: EmailTemplate
  category?: EmailCategory | null
  locale?: string
  unsubscribeUrl?: string
}

export const sendMail = async ({
  category = null,
  locale: requestedLocale,
  template,
  to,
  unsubscribeUrl,
}: SendMailOptions) => {
  const locale = requestedLocale ?? (await recipientLocale(to))
  const messages = await messagesFor(locale)
  const { subject, element } = buildEmail({ category, locale, messages, template })
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })])
  const recipients = Array.isArray(to) ? to.join(', ') : to
  await transporter.sendMail({
    from: process.env.SMTP_SENDER,
    to: recipients,
    subject,
    html,
    text,
    headers: unsubscribeUrl
      ? { 'List-Unsubscribe': `<${unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
      : undefined,
  })
  if (mailTransport !== 'smtp') console.info(`[mail] ${template.name} to ${recipients}: ${subject}`)
}
