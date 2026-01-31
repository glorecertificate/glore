import metadata from '~/config/metadata.json'

import { EmailLayout, EmailRow, EmailSection } from '@/email/components/layout'
import { EmailLink } from '@/email/components/link'
import { EmailText } from '@/email/components/text'
import { type AccountEmailChangedProps } from '@/email/types'
import { accountEmailPreviewProps, getEmailTranslations } from '@/email/utils'

const AccountEmailChangedEmail = async ({
  locale,
  newEmail,
  oldEmail,
  username,
  variant,
  ...props
}: AccountEmailChangedProps) => {
  const tCommon = await getEmailTranslations('Email.common', locale)
  const t = await getEmailTranslations('Email.account/email-changed', locale)

  const isNew = variant === 'new'

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
          <EmailText>{isNew ? t('introNew', { email: newEmail }) : t('introOld', { email: newEmail })}</EmailText>
          <EmailText>
            {isNew ? t('detailsNew', { oldEmail, newEmail }) : t('detailsOld', { oldEmail, newEmail })}
          </EmailText>
          <EmailText>{t('security')}</EmailText>
        </EmailRow>
      </EmailSection>
    </EmailLayout>
  )
}

AccountEmailChangedEmail.PreviewProps = accountEmailPreviewProps<'email-changed'>()

export default AccountEmailChangedEmail
