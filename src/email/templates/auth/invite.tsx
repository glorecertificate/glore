import metadata from '@config/metadata'
import { EmailButton } from '@/email/components/button'
import { EmailLayout, EmailRow, EmailSection } from '@/email/components/layout'
import { EmailLink } from '@/email/components/link'
import { EmailText } from '@/email/components/text'
import { type AuthEmailProps } from '@/email/types'
import { authEmailPreviewProps, getEmailTranslations } from '@/email/utils'

const AuthInviteEmail = async ({ data, locale, username, ...props }: AuthEmailProps) => {
  const tCommon = await getEmailTranslations('Email.common', locale)
  const t = await getEmailTranslations('Email.auth/invite', locale)

  const inviteUrl = `${data.redirect_to}?token_hash=${data.token_hash}&type=invite`

  return (
    <EmailLayout
      footer={t.rich('footer', {
        emailLink: link => <EmailLink href={`mailto:${metadata.email}`}>{link}</EmailLink>,
      })}
      locale={locale}
      {...props}
    >
      <EmailSection>
        <EmailRow>
          <EmailText className="text font-medium">
            {username ? tCommon('greetingUser', { user: username }) : tCommon('greeting')}
          </EmailText>
          <EmailText>{t('intro')}</EmailText>
          <EmailText>{t('buttonInstruction')}</EmailText>
        </EmailRow>
      </EmailSection>

      <EmailSection className="my-2 text-center">
        <EmailButton href={inviteUrl}>{t('button')}</EmailButton>
      </EmailSection>

      <EmailSection>
        <EmailText>
          {t('manualLink')} <EmailLink href={inviteUrl}>{inviteUrl}</EmailLink>
        </EmailText>
        <EmailText>{t('instructions')}</EmailText>
      </EmailSection>
    </EmailLayout>
  )
}

AuthInviteEmail.PreviewProps = authEmailPreviewProps<'invite'>()

export default AuthInviteEmail
