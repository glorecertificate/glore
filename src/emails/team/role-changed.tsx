import { Notice } from '@/emails/notice'
import { type EmailBaseProps, emailTranslator } from '@/emails/translate'
import metadata from '~/config/metadata.json'

interface TeamRoleChangedEmailProps extends EmailBaseProps {
  url: string
  role?: 'admin' | 'editor' | null
  userName?: string
}

const TeamRoleChangedEmail = ({ role = null, url, userName, ...base }: TeamRoleChangedEmailProps) => {
  const t = emailTranslator('Email.team/role-changed', base)
  const kind = role ? 'set' : 'removed'
  const values = { role: role ? t(`role_${role}`) : '' }

  return (
    <Notice
      {...base}
      action={{ href: url, label: t('button') }}
      details={[t(`details_${kind}`, values)]}
      footer={t('footer')}
      intro={t(`intro_${kind}`, values)}
      preview={t(`preview_${kind}`, values)}
      userName={userName}
    />
  )
}

TeamRoleChangedEmail.PreviewProps = {
  role: 'editor',
  url: `${metadata.url}/dashboard`,
  userName: 'Jane',
} satisfies TeamRoleChangedEmailProps

export default TeamRoleChangedEmail
