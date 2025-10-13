import { Body, Button, Container, Head, Hr, Html, Img, Preview, Section, Text } from '@react-email/components'

interface KoalaWelcomeEmailProps {
  userFirstname: string
}

export const KoalaWelcomeEmail = ({ userFirstname }: KoalaWelcomeEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>{'The sales intelligence platform that helps you uncover qualified leads.'}</Preview>
      <Container style={container}>
        <Img alt="Koala" height="50" src="/static/koala.png" style={logo} width="170" />
        <Text style={paragraph}>
          {'Hi '}
          {userFirstname}
          {','}
        </Text>
        <Text style={paragraph}>
          {'Welcome to Koala, the sales intelligence platform that helps you'}
          {'uncover qualified leads and close deals faster.'}
        </Text>
        <Section style={btnContainer}>
          <Button href="https://getkoala.com" style={button}>
            {'Get started'}
          </Button>
        </Section>
        <Text style={paragraph}>
          {'Best,'}
          <br />
          {'The Koala team'}
        </Text>
        <Hr style={hr} />
        <Text style={footer}>{'470 Noor Ave STE B #1148, South San Francisco, CA 94080'}</Text>
      </Container>
    </Body>
  </Html>
)

KoalaWelcomeEmail.PreviewProps = {
  userFirstname: 'Alan',
} as KoalaWelcomeEmailProps

export default KoalaWelcomeEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
}

const logo = {
  margin: '0 auto',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
}

const btnContainer = {
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#5F51E8',
  borderRadius: '3px',
  color: '#fff',
  display: 'block',
  fontSize: '16px',
  padding: '12px',
  textAlign: 'center' as const,
  textDecoration: 'none',
}

const hr = {
  borderColor: '#cccccc',
  margin: '20px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
}
