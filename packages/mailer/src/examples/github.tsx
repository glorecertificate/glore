import { Body, Button, Container, Head, Html, Img, Link, Preview, Section, Text } from '@react-email/components'

interface GithubAccessTokenEmailProps {
  username?: string
}

export const GithubAccessTokenEmail = ({ username }: GithubAccessTokenEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>{'A fine-grained personal access token has been added to your account'}</Preview>
      <Container style={container}>
        <Img alt="Github" height="32" src="/static/github.png" width="32" />

        <Text style={title}>
          <strong>
            {'@'}
            {username}
          </strong>
          {', a personal access was created on your'}
          {'account.'}
        </Text>

        <Section style={section}>
          <Text style={text}>
            {'Hey '}
            <strong>{username}</strong>
            {'!'}
          </Text>
          <Text style={text}>
            {'A fine-grained personal access token ('}
            <Link>{'resend'}</Link>
            {') was'}
            {'recently added to your account.'}
          </Text>

          <Button style={button}>{'View your token'}</Button>
        </Section>
        <Text style={links}>
          <Link style={link}>{'Your security audit log'}</Link>
          {' ・'} <Link style={link}>{'Contact support'}</Link>
        </Text>

        <Text style={footer}>{'GitHub, Inc. ・88 Colin P Kelly Jr Street ・San Francisco, CA 94107'}</Text>
      </Container>
    </Body>
  </Html>
)

GithubAccessTokenEmail.PreviewProps = {
  username: 'alanturing',
} as GithubAccessTokenEmailProps

export default GithubAccessTokenEmail

const main = {
  backgroundColor: '#ffffff',
  color: '#24292e',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"',
}

const container = {
  margin: '0 auto',
  maxWidth: '480px',
  padding: '20px 0 48px',
}

const title = {
  fontSize: '24px',
  lineHeight: 1.25,
}

const section = {
  border: 'solid 1px #dedede',
  borderRadius: '5px',
  padding: '24px',
  textAlign: 'center' as const,
}

const text = {
  margin: '0 0 10px 0',
  textAlign: 'left' as const,
}

const button = {
  backgroundColor: '#28a745',
  borderRadius: '0.5em',
  color: '#fff',
  fontSize: '14px',
  lineHeight: 1.5,
  padding: '12px 24px',
}

const links = {
  textAlign: 'center' as const,
}

const link = {
  color: '#0366d6',
  fontSize: '12px',
}

const footer = {
  color: '#6a737d',
  fontSize: '12px',
  marginTop: '60px',
  textAlign: 'center' as const,
}
