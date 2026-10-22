import { Notice } from '@/emails/notice'
import { type EmailBaseProps, emailTranslator } from '@/emails/translate'
import metadata from '~/config/metadata.json'

interface CertificateAssignedEmailProps extends EmailBaseProps {
  kind?: 'assigned' | 'resubmitted' | 'submitted'
  url?: string
  userName?: string
}

const CertificateAssignedEmail = ({
  kind = 'assigned',
  url = `${process.env.APP_URL}/certificates`,
  userName,
  ...base
}: CertificateAssignedEmailProps) => {
  const t = emailTranslator('Email.certificate/assigned', base)

  return (
    <Notice
      {...base}
      action={{ href: url, label: t('button') }}
      footer={t('footer')}
      intro={t(`intro_${kind}`)}
      preview={t(`preview_${kind}`)}
      userName={userName}
    />
  )
}

CertificateAssignedEmail.PreviewProps = {
  kind: 'assigned',
  url: `${metadata.url}/certificates/1/review`,
  userName: 'Alex',
} satisfies CertificateAssignedEmailProps

export default CertificateAssignedEmail
