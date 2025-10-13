import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'

interface SlackConfirmEmailProps {
  validationCode?: string
}

export const SlackConfirmEmail = ({ validationCode }: SlackConfirmEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>{'Confirm your email address'}</Preview>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img alt="Slack" height="36" src="/static/slack.png" width="120" />
        </Section>
        <Heading style={h1}>{'Confirm your email address'}</Heading>
        <Text style={heroText}>
          {'Your confirmation code is below - enter it in your open browser window'}
          {"and we'll help you get signed in."}
        </Text>

        <Section style={codeBox}>
          <Text style={confirmationCodeText}>{validationCode}</Text>
        </Section>

        <Text style={text}>
          {"If you didn't request this email, there's nothing to worry about, you"}
          {'can safely ignore it.'}
        </Text>

        <Section>
          <Row style={footerLogos}>
            <Column style={{ width: '66%' }}>
              <Img alt="Slack" height="36" src="/static/slack.png" width="120" />
            </Column>
            <Column align="right">
              <Link href="/">
                <Img alt="Slack" height="32" src="/static/slack-twitter.png" style={socialMediaIcon} width="32" />
              </Link>
              <Link href="/">
                <Img alt="Slack" height="32" src="/static/slack-facebook.png" style={socialMediaIcon} width="32" />
              </Link>
              <Link href="/">
                <Img alt="Slack" height="32" src="/static/slack-linkedin.png" style={socialMediaIcon} width="32" />
              </Link>
            </Column>
          </Row>
        </Section>

        <Section>
          <Link href="https://slackhq.com" rel="noopener noreferrer" style={footerLink} target="_blank">
            {'Our blog'}
          </Link>
          &nbsp;&nbsp;&nbsp;{'|'}&nbsp;&nbsp;&nbsp;
          <Link href="https://slack.com/legal" rel="noopener noreferrer" style={footerLink} target="_blank">
            {'Policies'}
          </Link>
          &nbsp;&nbsp;&nbsp;{'|'}&nbsp;&nbsp;&nbsp;
          <Link href="https://slack.com/help" rel="noopener noreferrer" style={footerLink} target="_blank">
            {'Help center'}
          </Link>
          &nbsp;&nbsp;&nbsp;{'|'}&nbsp;&nbsp;&nbsp;
          <Link
            data-auth="NotApplicable"
            data-linkindex="6"
            href="https://slack.com/community"
            rel="noopener noreferrer"
            style={footerLink}
            target="_blank"
          >
            {'Slack Community'}
          </Link>
          <Text style={footerText}>
            {'©2022 Slack Technologies, LLC, a Salesforce company. '}
            <br />
            {'500 Howard Street, San Francisco, CA 94105, USA '}
            <br />
            <br />
            {'All rights reserved.'}
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

SlackConfirmEmail.PreviewProps = {
  validationCode: 'DJZ-TLX',
} as SlackConfirmEmailProps

export default SlackConfirmEmail

const footerText = {
  color: '#b7b7b7',
  fontSize: '12px',
  lineHeight: '15px',
  marginBottom: '50px',
  textAlign: 'left' as const,
}

const footerLink = {
  color: '#b7b7b7',
  textDecoration: 'underline',
}

const footerLogos = {
  marginBottom: '32px',
  paddingLeft: '8px',
  paddingRight: '8px',
}

const socialMediaIcon = {
  display: 'inline',
  marginLeft: '8px',
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  margin: '0 auto',
}

const container = {
  margin: '0 auto',
  padding: '0px 20px',
}

const logoContainer = {
  marginTop: '32px',
}

const h1 = {
  color: '#1d1c1d',
  fontSize: '36px',
  fontWeight: '700',
  lineHeight: '42px',
  margin: '30px 0',
  padding: '0',
}

const heroText = {
  fontSize: '20px',
  lineHeight: '28px',
  marginBottom: '30px',
}

const codeBox = {
  background: 'rgb(245, 244, 245)',
  borderRadius: '4px',
  marginBottom: '30px',
  padding: '40px 10px',
}

const confirmationCodeText = {
  fontSize: '30px',
  textAlign: 'center' as const,
  verticalAlign: 'middle',
}

const text = {
  color: '#000',
  fontSize: '14px',
  lineHeight: '24px',
}
