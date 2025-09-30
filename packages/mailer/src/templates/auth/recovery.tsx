import { useMemo } from 'react'

import metadata from '@config/metadata'

import { Button } from '@glore/mailer/components/button'
import { Layout, Row, Section } from '@glore/mailer/components/layout'
import { Link } from '@glore/mailer/components/link'
import { Text } from '@glore/mailer/components/text'
import { mailer } from '@glore/mailer/config'
import { type AuthEmailProps } from '@glore/mailer/types'
import { previewProps } from '@glore/mailer/utils'

export interface AuthRecoveryProps extends AuthEmailProps<'recovery'> {}

const AuthRecovery = ({ f, t, tokenHash, username, ...props }: AuthRecoveryProps) => {
  const resetUrl = useMemo(() => `${mailer.appUrl}/auth/reset-password?token=${tokenHash}`, [tokenHash])

  return (
    <Layout
      footer={f(t.footer, {
        emailLink: chunks => (
          <Link href={`mailto:${metadata.email}`} key={chunks[0]}>
            {chunks}
          </Link>
        ),
      })}
      t={t.common}
      {...props}
    >
      <Section>
        <Row>
          <Text className="text font-medium">{username ? f(t.greetingUser, { user: username }) : t.greeting}</Text>
          <Text>{t.intro}</Text>
          <Text>{t.buttonInstruction}</Text>
        </Row>
      </Section>

      <Section className="my-2 text-center">
        <Button href={resetUrl}>{t.button}</Button>
      </Section>

      <Section>
        <Text>
          {t.manualLink} <Link href={resetUrl}>{resetUrl}</Link>
        </Text>
        <Text>{t.instructions}</Text>
      </Section>
    </Layout>
  )
}

AuthRecovery.PreviewProps = previewProps<'auth/recovery'>({
  to: 'user@example.com',
  t: {
    subject: 'Reset your GloRe password',
    greeting: 'Hello there,',
    greetingUser: 'Hello {user},',
    intro: 'You recently requested to reset your password for your account.',
    buttonInstruction: 'Click the button below to update it:',
    button: 'Reset your password',
    manualLink: 'If the button above does not work, open the following link in your browser:',
    instructions: 'This password reset link is valid for the next 24 hours.',
    footer: `You're receiving this email because you requested a password reset for your ${metadata.shortName} account. If you didn't request it, please ignore this email or <emailLink>let us know</emailLink>.`,
  },
})

export default AuthRecovery
