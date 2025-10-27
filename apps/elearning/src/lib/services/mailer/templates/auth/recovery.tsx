import metadata from '@config/metadata'

import { EmailButton } from '../../components/button'
import { EmailLayout, EmailRow, EmailSection } from '../../components/layout'
import { EmailLink } from '../../components/link'
import { EmailText } from '../../components/text'
import { type AuthEmailProps } from '../../types'
import { authPreviewProps, getTranslations } from '../../utils'

const AuthRecovery = async ({
  locale,
  redirectTo,
  token,
  tokenHash,
  tokenHashNew,
  tokenNew,
  username,
  ...props
}: AuthEmailProps) => {
  const tCommon = await getTranslations('Email.common', { locale })
  const t = await getTranslations('Email.auth/recovery', { locale })

  const resetUrl = `${redirectTo}?resetToken=${tokenHash}`

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

AuthRecovery.PreviewProps = authPreviewProps<'recovery'>()

export default AuthRecovery
