import { Notice } from '@/emails/notice'
import { type EmailBaseProps, emailTranslator } from '@/emails/translate'
import metadata from '~/config/metadata.json'

interface CertificateDecisionEmailProps extends EmailBaseProps {
  kind: 'rejected' | 'revoked'
  url: string
  reason?: string
  userName?: string
}

const CertificateDecisionEmail = ({ kind, reason, url, userName, ...base }: CertificateDecisionEmailProps) => {
  const t = emailTranslator('Email.certificate/decision', base)

  return (
    <Notice
      {...base}
      action={{ href: url, label: t('button') }}
      details={[t(`details_${kind}`)]}
      footer={t('footer')}
      intro={t(`intro_${kind}`)}
      preview={t(`preview_${kind}`)}
      quote={reason ? { label: t('reasonLabel'), text: reason } : undefined}
      userName={userName}
    />
  )
}

CertificateDecisionEmail.PreviewProps = {
  kind: 'rejected',
  reason: 'The activity dates do not match the hours you entered. Please check them and try again.',
  url: `${metadata.url}/certificates/1`,
  userName: 'Jane',
} satisfies CertificateDecisionEmailProps

export default CertificateDecisionEmail
