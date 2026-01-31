import metadata from '~/config/metadata.json'

import { EmailLayout, EmailRow, EmailSection } from '@/email/components/layout'
import { EmailLink } from '@/email/components/link'
import { EmailText } from '@/email/components/text'
import { type EmailProps } from '@/email/types'
import { emailPreviewProps, getEmailTranslations } from '@/email/utils'

const AccountPasswordChangedEmail = async ({ locale, username, ...props }: EmailProps) => {
  const tCommon = await getEmailTranslations('Email.common', locale)
  const t = await getEmailTranslations('Email.account/password-changed', locale)

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
          <EmailText className="font-medium">
            {username ? tCommon('greetingUser', { user: username }) : tCommon('greeting')}
          </EmailText>
          <EmailText>{t('intro')}</EmailText>
          <EmailText>{t('details')}</EmailText>
        </EmailRow>
      </EmailSection>
    </EmailLayout>
  )
}

AccountPasswordChangedEmail.PreviewProps = emailPreviewProps<'account/password-changed'>()

export default AccountPasswordChangedEmail
