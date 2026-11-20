import { Notice } from '@/emails/notice'
import { type EmailBaseProps, emailTranslator } from '@/emails/translate'
import metadata from '~/config/metadata.json'

interface OrganizationMembershipEmailProps extends EmailBaseProps {
  kind: 'member_left' | 'ownership_gained' | 'ownership_left' | 'removed' | 'role_changed'
  organizationName: string
  url: string
  memberName?: string
  previousRole?: string
  role?: string
  userName?: string
}

const OrganizationMembershipEmail = ({
  kind,
  memberName,
  organizationName,
  previousRole,
  role,
  url,
  userName,
  ...base
}: OrganizationMembershipEmailProps) => {
  const t = emailTranslator('Email.organization/membership', base)
  const common = emailTranslator('Email.common', base)
  const label = (value?: string) => (value ? common(`role_${value}`) : '')
  const values = {
    memberName: memberName ?? '',
    organizationName,
    previousRole: label(previousRole),
    role: label(role),
  }

  return (
    <Notice
      {...base}
      action={{ href: url, label: t('button') }}
      details={[t(`details_${kind}`, values)]}
      footer={t(kind === 'member_left' ? 'footer_member_left' : 'footer', values)}
      intro={t(`intro_${kind}`, values)}
      preview={t(`preview_${kind}`, values)}
      userName={userName}
    />
  )
}

OrganizationMembershipEmail.PreviewProps = {
  kind: 'role_changed',
  organizationName: 'Acme Youth Association',
  previousRole: 'volunteer',
  role: 'tutor',
  url: `${metadata.url}/dashboard`,
  userName: 'Jane',
} satisfies OrganizationMembershipEmailProps

export default OrganizationMembershipEmail
