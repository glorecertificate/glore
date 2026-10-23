import { Text } from 'react-email'

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
      <Text className="my-4 rounded-lg bg-[#f4f4f5] px-4 py-3 text-center font-mono text-[16px] font-semibold text-[#0a0a0a]">
        {username}
      </Text>
      <Text className="text-[13px] leading-5.5 text-[#71717a]">{t('details')}</Text>
    </Notice>
  )
}

AccountWelcomeEmail.PreviewProps = {
  url: `${metadata.url}/dashboard`,
  userName: 'Jane',
  username: 'jane.doe',
} satisfies AccountWelcomeEmailProps

export default AccountWelcomeEmail
