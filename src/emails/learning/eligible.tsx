import { Notice } from '@/emails/notice'
import { type EmailBaseProps, emailTranslator } from '@/emails/translate'
import metadata from '~/config/metadata.json'

interface LearningEligibleEmailProps extends EmailBaseProps {
  url: string
  userName?: string
}

const LearningEligibleEmail = ({ url, userName, ...base }: LearningEligibleEmailProps) => {
  const t = emailTranslator('Email.learning/eligible', base)

  return (
    <Notice
      {...base}
      action={{ href: url, label: t('button') }}
      details={[t('details')]}
      footer={t('footer')}
      intro={t('intro')}
      preview={t('preview')}
      userName={userName}
    />
  )
}

LearningEligibleEmail.PreviewProps = {
  url: `${metadata.url}/certificates/new`,
  userName: 'Jane',
} satisfies LearningEligibleEmailProps

export default LearningEligibleEmail
