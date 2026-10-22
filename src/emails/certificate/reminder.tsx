import { Notice } from '@/emails/notice'
import { type EmailBaseProps, emailTranslator } from '@/emails/translate'
import metadata from '~/config/metadata.json'

interface CertificateReminderEmailProps extends EmailBaseProps {
  days: number
  kind: 'escalated' | 'reminder'
  url: string
  userName?: string
}

const CertificateReminderEmail = ({ days, kind, url, userName, ...base }: CertificateReminderEmailProps) => {
  const t = emailTranslator('Email.certificate/reminder', base)

  return (
    <Notice
      {...base}
      action={{ href: url, label: t(`button_${kind}`) }}
      details={[t(`details_${kind}`, { days })]}
      footer={t(`footer_${kind}`)}
      intro={t(`intro_${kind}`, { days })}
      preview={t(`preview_${kind}`, { days })}
      userName={userName}
    />
  )
}

CertificateReminderEmail.PreviewProps = {
  days: 3,
  kind: 'reminder',
  url: `${metadata.url}/certificates/1/review`,
  userName: 'Alex',
} satisfies CertificateReminderEmailProps

export default CertificateReminderEmail
