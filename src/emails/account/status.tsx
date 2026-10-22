import { Notice } from '@/emails/notice'
import { type EmailBaseProps, emailTranslator } from '@/emails/translate'

interface AccountStatusEmailProps extends EmailBaseProps {
  kind: 'deleted' | 'suspended'
  expiresAt?: string | null
  reason?: string | null
  userName?: string
}

const AccountStatusEmail = ({ expiresAt, kind, reason, userName, ...base }: AccountStatusEmailProps) => {
  const t = emailTranslator('Email.account/status', base)
  const details =
    kind === 'suspended'
      ? [expiresAt ? t('details_suspended_until', { expiresAt: new Date(expiresAt) }) : t('details_suspended')]
      : [t('details_deleted')]

  return (
    <Notice
      {...base}
      details={details}
      footer={t('footer')}
      intro={t(`intro_${kind}`)}
      preview={t(`preview_${kind}`)}
      quote={reason ? { label: t('reasonLabel'), text: reason } : undefined}
      userName={userName}
    />
  )
}

AccountStatusEmail.PreviewProps = {
  expiresAt: '2026-11-22T12:00:00.000Z',
  kind: 'suspended',
  reason: 'Repeated violations of the community rules.',
  userName: 'Jane',
} satisfies AccountStatusEmailProps

export default AccountStatusEmail
