import { Notice } from '@/emails/notice'
import { type EmailBaseProps, emailTranslator } from '@/emails/translate'
import metadata from '~/config/metadata.json'

interface OrganizationJoinRequestReceivedEmailProps extends EmailBaseProps {
  organizationName: string
  requesterName: string
  url: string
  userName?: string
}

const OrganizationJoinRequestReceivedEmail = ({
  organizationName,
  requesterName,
  url,
  userName,
  ...base
}: OrganizationJoinRequestReceivedEmailProps) => {
  const t = emailTranslator('Email.organization/join-request-received', base)
  const values = { organizationName, requesterName }

  return (
    <Notice
      {...base}
      action={{ href: url, label: t('button') }}
      details={[t('details')]}
      footer={t('footer', values)}
      intro={t('intro', values)}
      preview={t('preview', values)}
      userName={userName}
    />
  )
}

OrganizationJoinRequestReceivedEmail.PreviewProps = {
  organizationName: 'Acme Youth Association',
  requesterName: 'Sam Lee',
  url: `${metadata.url}/organization?tab=requests`,
  userName: 'Alex',
} satisfies OrganizationJoinRequestReceivedEmailProps

export default OrganizationJoinRequestReceivedEmail
