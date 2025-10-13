import { Body, Column, Container, Head, Html, Img, Link, Preview, Row, Section, Text } from '@react-email/components'

interface TwitchResetEmailProps {
  updatedDate?: Date
  username?: string
}

export const TwitchResetEmail = ({ username }: TwitchResetEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>{'You updated the password for your Twitch account'}</Preview>
      <Container style={container}>
        <Section style={logo}>
          <Img alt="Twitch" src="/static/twitch.png" style={logoImg} width={114} />
        </Section>
        <Section style={sectionsBorders}>
          <Row>
            <Column style={sectionBorder} />
            <Column style={sectionCenter} />
            <Column style={sectionBorder} />
          </Row>
        </Section>
        <Section style={content}>
          <Text style={paragraph}>
            {'Hi '}
            {username}
            {','}
          </Text>
          <Text style={paragraph}>
            {'You updated the password for your Twitch account on'} {'. If this was you, then no further action is'}
            {'required.'}
          </Text>
          <Text style={paragraph}>
            {'However if you did NOT perform this password change, please'}{' '}
            <Link href="https://www.twitch.tv" style={link}>
              {'reset your account password'}
            </Link>{' '}
            {'immediately.'}
          </Text>
          <Text style={paragraph}>
            {'Remember to use a password that is both strong and unique to your'}
            {'Twitch account. To learn more about how to create a strong and'}
            {'unique password,'}{' '}
            <Link href="https://www.twitch.tv" style={link}>
              {'click here.'}
            </Link>
          </Text>
          <Text style={paragraph}>
            {'Still have questions? Please contact'}{' '}
            <Link href="https://www.twitch.tv" style={link}>
              {'Twitch Support'}
            </Link>
          </Text>
          <Text style={paragraph}>
            {'Thanks,'}
            <br />
            {'Twitch Support Team'}
          </Text>
        </Section>
      </Container>

      <Section style={footer}>
        <Row>
          <Column align="right" style={{ paddingRight: '8px', width: '50%' }}>
            <Img alt="Twitter" src="/static/twitch-twitter.png" />
          </Column>
          <Column align="left" style={{ paddingLeft: '8px', width: '50%' }}>
            <Img alt="Facebook" src="/static/twitch-facebook.png" />
          </Column>
        </Row>
        <Row>
          <Text style={{ color: '#706a7b', textAlign: 'center' }}>
            {'© 2022 Twitch, All Rights Reserved '}
            <br />
            {'350 Bush Street, 2nd Floor, San Francisco, CA, 94104 - USA'}
          </Text>
        </Row>
      </Section>
    </Body>
  </Html>
)

TwitchResetEmail.PreviewProps = {
  updatedDate: new Date('June 23, 2022 4:06:00 pm UTC'),
  username: 'alanturing',
} as TwitchResetEmailProps

export default TwitchResetEmail

const fontFamily = 'HelveticaNeue,Helvetica,Arial,sans-serif'

const main = {
  backgroundColor: '#efeef1',
  fontFamily,
}

const paragraph = {
  fontSize: 14,
  lineHeight: 1.5,
}

const container = {
  backgroundColor: '#ffffff',
  margin: '30px auto',
  maxWidth: '580px',
}

const footer = {
  margin: '0 auto',
  maxWidth: '580px',
}

const content = {
  padding: '5px 20px 10px 20px',
}

const logo = {
  padding: 30,
}

const logoImg = {
  margin: '0 auto',
}

const sectionsBorders = {
  width: '100%',
}

const sectionBorder = {
  borderBottom: '1px solid rgb(238,238,238)',
  width: '249px',
}

const sectionCenter = {
  borderBottom: '1px solid rgb(145,71,255)',
  width: '102px',
}

const link = {
  textDecoration: 'underline',
}
