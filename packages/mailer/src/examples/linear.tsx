import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface LinearLoginCodeEmailProps {
  validationCode?: string
}

export const LinearLoginCodeEmail = ({ validationCode }: LinearLoginCodeEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>{'Your login code for Linear'}</Preview>
      <Container style={container}>
        <Img alt="Linear" height="42" src="/static/linear.png" style={logo} width="42" />
        <Heading style={heading}>{'Your login code for Linear'}</Heading>
        <Section style={buttonContainer}>
          <Button href="https://linear.app" style={button}>
            {'Login to Linear'}
          </Button>
        </Section>
        <Text style={paragraph}>
          {'This link and code will only be valid for the next 5 minutes. If the'}
          {'link does not work, you can use the login verification code directly:'}
        </Text>
        <code style={code}>{validationCode}</code>
        <Hr style={hr} />
        <Link href="https://linear.app" style={reportLink}>
          {'Linear'}
        </Link>
      </Container>
    </Body>
  </Html>
)

LinearLoginCodeEmail.PreviewProps = {
  validationCode: 'tt226-5398x',
} as LinearLoginCodeEmailProps

export default LinearLoginCodeEmail

const logo = {
  borderRadius: 21,
  height: 42,
  width: 42,
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  maxWidth: '560px',
  padding: '20px 0 48px',
}

const heading = {
  color: '#484848',
  fontSize: '24px',
  fontWeight: '400',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  padding: '17px 0 0',
}

const paragraph = {
  color: '#3c4149',
  fontSize: '15px',
  lineHeight: '1.4',
  margin: '0 0 15px',
}

const buttonContainer = {
  padding: '27px 0 27px',
}

const button = {
  backgroundColor: '#5e6ad2',
  borderRadius: '3px',
  color: '#fff',
  display: 'block',
  fontSize: '15px',
  fontWeight: '600',
  padding: '11px 23px',
  textAlign: 'center' as const,
  textDecoration: 'none',
}

const reportLink = {
  color: '#b4becc',
  fontSize: '14px',
}

const hr = {
  borderColor: '#dfe1e4',
  margin: '42px 0 26px',
}

const code = {
  backgroundColor: '#dfe1e4',
  borderRadius: '4px',
  color: '#3c4149',
  fontFamily: 'monospace',
  fontSize: '21px',
  fontWeight: '700',
  letterSpacing: '-0.3px',
  padding: '1px 4px',
}
