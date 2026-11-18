import { Link, Text } from 'react-email'

import { EMAIL_CLASSES } from '@/emails/classes'
import { Notice } from '@/emails/notice'
import { type EmailBaseProps, emailTranslator } from '@/emails/translate'
import metadata from '~/config/metadata.json'

interface OrganizationInvitationEmailProps extends EmailBaseProps {
  expiresAt: string
  organizationName: string
  role: string
  url: string
  inviterName?: string | null
  kind?: 'invite' | 'reminder'
  message?: string | null
  userName?: string
}

const OrganizationInvitationEmail = ({
  expiresAt,
  inviterName,
  kind = 'invite',
  message,
  organizationName,
  role,
  url,
  userName,
  ...base
}: OrganizationInvitationEmailProps) => {
  const t = emailTranslator('Email.organization/invitation', base)
  const common = emailTranslator('Email.common', base)
  const isReminder = kind === 'reminder'
  const values = { expiresAt: new Date(expiresAt), organizationName, role: common(`role_${role}`) }
  const intro = isReminder
    ? t('introReminder', values)
    : inviterName
      ? t('introInviter', { ...values, inviter: inviterName })
      : t('intro', values)

  return (
    <Notice
      {...base}
      action={{ href: url, label: t('button') }}
      details={[t('about'), isReminder ? t('expiryReminder', values) : t('expiry', values)]}
      footer={t('footer')}
      intro={intro}
      preview={isReminder ? t('previewReminder', values) : t('preview', values)}
      quote={
        message && !isReminder
          ? { label: inviterName ? t('messageLabel', { inviter: inviterName }) : t('messageAnonymous'), text: message }
          : undefined
      }
      userName={userName}
    >
      <Text className={`mt-2 ${EMAIL_CLASSES.fine}`}>{t('manualLink')}</Text>
      <Link className={EMAIL_CLASSES.manualLink} href={url}>
        {url}
      </Link>
    </Notice>
  )
}

OrganizationInvitationEmail.PreviewProps = {
  expiresAt: '2026-10-29T12:00:00.000Z',
  inviterName: 'Alex Rossi',
  message: 'We would love to have you with us for the spring projects.',
  organizationName: 'Acme Youth Association',
  role: 'volunteer',
  url: `${metadata.url}/invite/preview-token?proof=preview-proof`,
  userName: 'Jane',
} satisfies OrganizationInvitationEmailProps

export default OrganizationInvitationEmail
