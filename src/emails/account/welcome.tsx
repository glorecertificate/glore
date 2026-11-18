import { Text } from 'react-email'

import { EMAIL_CLASSES } from '@/emails/classes'
import { Notice } from '@/emails/notice'
import { type EmailBaseProps, emailTranslator } from '@/emails/translate'
import metadata from '~/config/metadata.json'

interface AccountWelcomeEmailProps extends EmailBaseProps {
  url: string
  username: string
  userName?: string
}

const AccountWelcomeEmail = ({ url, userName, username, ...base }: AccountWelcomeEmailProps) => {
  const t = emailTranslator('Email.account/welcome', base)

  return (
    <Notice
      {...base}
      action={{ href: url, label: t('button') }}
      footer={t('footer')}
      intro={t('intro')}
      preview={t('preview')}
      userName={userName}
    >
      <Text className={EMAIL_CLASSES.chip}>{username}</Text>
      <Text className={EMAIL_CLASSES.detail}>{t('details')}</Text>
    </Notice>
  )
}

AccountWelcomeEmail.PreviewProps = {
  url: `${metadata.url}/dashboard`,
  userName: 'Jane',
  username: 'jane.doe',
} satisfies AccountWelcomeEmailProps

export default AccountWelcomeEmail
