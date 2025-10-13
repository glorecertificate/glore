import { Body, Button, Container, Head, Html, Img, Link, Preview, Section, Text } from '@react-email/components'

interface DropboxResetEmailProps {
  resetPasswordLink?: string
  userFirstname?: string
}

export const DropboxResetEmail = ({ resetPasswordLink, userFirstname }: DropboxResetEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>{'Dropbox reset your password'}</Preview>
      <Container style={container}>
        <Img alt="Dropbox" height="33" src="/static/dropbox.png" width="40" />
        <Section>
          <Text style={text}>
            {'Hi '}
            {userFirstname}
            {','}
          </Text>
          <Text style={text}>
            {'Someone recently requested a password change for your Dropbox'}
            {'account. If this was you, you can set a new password here:'}
          </Text>
          <Button href={resetPasswordLink} style={button}>
            {'Reset password'}
          </Button>
          <Text style={text}>
            {'If you don'}&apos;{'t want to change your password or didn'}&apos;{'t'}
            {'request this, just ignore and delete this message.'}
          </Text>
          <Text style={text}>
            {'To keep your account secure, please don'}&apos;{'t forward this email'}
            {'to anyone. See our Help Center for'}{' '}
            <Link href={resetPasswordLink} style={anchor}>
              {'more security tips.'}
            </Link>
          </Text>
          <Text style={text}>{'Happy Dropboxing!'}</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

DropboxResetEmail.PreviewProps = {
  resetPasswordLink: 'https://www.dropbox.com',
  userFirstname: 'Alan',
} as DropboxResetEmailProps

export default DropboxResetEmail

const main = {
  backgroundColor: '#f6f9fc',
  padding: '10px 0',
}

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #f0f0f0',
  padding: '45px',
}

const text = {
  color: '#404040',
  fontFamily:
    "'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif",
  fontSize: '16px',
  fontWeight: '300',
  lineHeight: '26px',
}

const button = {
  backgroundColor: '#007ee6',
  borderRadius: '4px',
  color: '#fff',
  display: 'block',
  fontFamily: "'Open Sans', 'Helvetica Neue', Arial",
  fontSize: '15px',
  padding: '14px 7px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  width: '210px',
}

const anchor = {
  textDecoration: 'underline',
}
