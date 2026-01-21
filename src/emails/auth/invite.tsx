import { metadata } from '@config/app'
import { EmailButton } from '@/components/email/button'
import { EmailLayout, EmailRow, EmailSection } from '@/components/email/layout'
import { EmailLink } from '@/components/email/link'
import { EmailText } from '@/components/email/text'
import { type AuthEmailProps, authEmailPreviewProps, getEmailTranslations } from '@/lib/mailer'

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
