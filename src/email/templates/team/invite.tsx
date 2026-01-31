import { Hr } from '@react-email/components'

import metadata from '~/config/metadata.json'

import { EmailButton } from '@/email/components/button'
import { EmailLayout, EmailRow, EmailSection } from '@/email/components/layout'
import { EmailLink } from '@/email/components/link'
import { EmailText } from '@/email/components/text'
import { type TeamInviteEmailProps } from '@/email/types'
import { getEmailTranslations, teamEmailPreviewProps } from '@/email/utils'

const TeamInviteEmail = async ({ inviteeName, joinUrl, locale, role, username, ...props }: TeamInviteEmailProps) => {
  const tCommon = await getEmailTranslations('Email.common', locale)
  const t = await getEmailTranslations('Email.team/invite', locale)

  const roleLabel = t(`role_${role}`)

  return (
    <EmailLayout
      footer={t.rich('footer', {
        invitee: inviteeName,
        emailLink: link => <EmailLink href={`mailto:${metadata.email}`}>{link}</EmailLink>,
      })}
      locale={locale}
      {...props}
    >
      <EmailSection>
        <EmailRow>
          <EmailText className="font-semibold text-xl" style={{ marginBottom: 4 }}>
            {username ? tCommon('greetingUser', { user: username }) : tCommon('greeting')}
          </EmailText>
          <EmailText className="text-gray-700" style={{ lineHeight: '1.6' }}>
            {t('intro', { invitee: inviteeName, role: roleLabel })}
          </EmailText>
          <EmailText className="text-gray-600" style={{ lineHeight: '1.6' }}>
            {t('description')}
          </EmailText>
        </EmailRow>
      </EmailSection>

      <EmailSection className="my-4 text-center">
        <EmailButton className="rounded-lg px-8 py-4 font-semibold text-base" href={joinUrl}>
          {t('button')}
        </EmailButton>
      </EmailSection>

      <Hr className="my-4 border-gray-200" />

      <EmailSection>
        <EmailText className="text-gray-500 text-sm" style={{ lineHeight: '1.5' }}>
          {t('manualLink')}
        </EmailText>
        <EmailText className="text-sm">
          <EmailLink className="break-all" href={joinUrl}>
            {joinUrl}
          </EmailLink>
        </EmailText>
        <EmailText className="mt-4 text-gray-400 text-xs">{t('expiry')}</EmailText>
      </EmailSection>
    </EmailLayout>
  )
}

TeamInviteEmail.PreviewProps = teamEmailPreviewProps<'invite'>()

export default TeamInviteEmail
