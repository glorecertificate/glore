import metadata from '@config/metadata'
import { EmailButton } from '@/email/components/button'
import { EmailLayout, EmailRow, EmailSection } from '@/email/components/layout'
import { EmailLink } from '@/email/components/link'
import { EmailText } from '@/email/components/text'
import { type AuthEmailProps } from '@/email/types'
import { authEmailPreviewProps, getEmailTranslations } from '@/email/utils'

const AuthRecoveryEmail = async ({ data, locale, username, ...props }: AuthEmailProps) => {
  const tCommon = await getEmailTranslations('Email.common', locale)
  const t = await getEmailTranslations('Email.auth/recovery', locale)

  const resetUrl = `${data.redirect_to}?resetToken=${data.token_hash}`

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
        <EmailButton href={resetUrl}>{t('button')}</EmailButton>
      </EmailSection>

      <EmailSection>
        <EmailText>
          {t('manualLink')} <EmailLink href={resetUrl}>{resetUrl}</EmailLink>
        </EmailText>
        <EmailText>{t('instructions')}</EmailText>
      </EmailSection>
    </EmailLayout>
  )
}

AuthRecoveryEmail.PreviewProps = authEmailPreviewProps<'recovery'>()

export default AuthRecoveryEmail
