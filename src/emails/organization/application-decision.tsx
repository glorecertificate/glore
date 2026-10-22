import { Notice } from '@/emails/notice'
import { type EmailBaseProps, emailTranslator } from '@/emails/translate'
import config from '~/config/app.json'
import metadata from '~/config/metadata.json'

interface OrganizationApplicationDecisionEmailProps extends EmailBaseProps {
  organizationName: string
  status: 'approved' | 'rejected'
  comment?: string | null
  url?: string
  userName?: string
}

const OrganizationApplicationDecisionEmail = ({
  comment,
  organizationName,
  status,
  url,
  userName,
  ...base
}: OrganizationApplicationDecisionEmailProps) => {
  const t = emailTranslator('Email.organization/application-decision', base)
  const values = { organizationName }
  const approved = status === 'approved'
  const details = [
    ...(approved ? [t(url ? 'details_approved_new' : 'details_approved')] : []),
    ...(comment ? [t('detailsComment', { comment })] : []),
  ]

  return (
    <Notice
      {...base}
      action={
        approved ? { href: url ?? `${process.env.APP_URL}/login`, label: t(url ? 'buttonSetup' : 'button') } : undefined
      }
      details={details}
      footer={t('footer')}
      intro={t(`intro_${status}`, values)}
      note={approved && url ? t('expiry', { days: config.invitationExpiryDays }) : undefined}
      preview={t(`preview_${status}`, values)}
      userName={userName}
    />
  )
}

OrganizationApplicationDecisionEmail.PreviewProps = {
  comment: 'Welcome to GloRe! Reach out to us any time if you need a hand getting started.',
  organizationName: 'Acme Corp',
  status: 'approved',
  url: `${metadata.url}/api/v1/join?token=preview-token`,
  userName: 'Jane',
} satisfies OrganizationApplicationDecisionEmailProps

export default OrganizationApplicationDecisionEmail
