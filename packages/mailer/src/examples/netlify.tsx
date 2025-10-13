import {
  Body,
  Button,
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
  Tailwind,
  Text,
  pixelBasedPreset,
} from '@react-email/components'

interface NetlifyWelcomeEmailProps {
  links: {
    title: string
    href: string
  }[]
  steps: {
    id: number
    Description: React.ReactNode
  }[]
}

export const NetlifyWelcomeEmail = ({ links, steps }: NetlifyWelcomeEmailProps) => (
  <Html>
    <Head />
    <Tailwind
      config={{
        presets: [pixelBasedPreset],
        theme: {
          extend: {
            colors: {
              brand: '#2250f4',
              offwhite: '#fafbfb',
            },
            spacing: {
              0: '0px',
              20: '20px',
              45: '45px',
            },
          },
        },
      }}
    >
      <Preview>{'Netlify Welcome'}</Preview>
      <Body className="bg-offwhite font-sans text-base">
        <Img alt="Netlify" className="mx-auto my-20" height="75" src="/static/netlify.png" width="184" />
        <Container className="bg-white p-45">
          <Heading className="my-0 text-center leading-8">{'Welcome to Netlify'}</Heading>

          <Section>
            <Row>
              <Text className="text-base">
                {"Congratulations! You're joining over 3 million developers"}
                {'around the world who use Netlify to build and ship sites,'}
                {'stores, and apps.'}
              </Text>

              <Text className="text-base">{"Here's how to get started:"}</Text>
            </Row>
          </Section>

          <ul>{steps?.map(({ Description }) => Description)}</ul>

          <Section className="text-center">
            <Button className="rounded-lg bg-brand px-[18px] py-3 text-white">{'Go to your dashboard'}</Button>
          </Section>

          <Section className="mt-45">
            <Row>
              {links?.map(link => (
                <Column key={link.title}>
                  <Link className="font-bold text-black underline" href={link.href}>
                    {link.title}
                  </Link>{' '}
                  <span className="text-green-500">{'→'}</span>
                </Column>
              ))}
            </Row>
          </Section>
        </Container>

        <Container className="mt-20">
          <Section>
            <Row>
              <Column className="px-20 text-right">
                <Link>{'Unsubscribe'}</Link>
              </Column>
              <Column className="text-left">
                <Link>{'Manage Preferences'}</Link>
              </Column>
            </Row>
          </Section>
          <Text className="mb-45 text-center text-gray-400">
            {'Netlify, 44 Montgomery Street, Suite 300 San Francisco, CA'}
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)

NetlifyWelcomeEmail.PreviewProps = {
  links: [
    {
      href: 'https://www.netlify.com',
      title: 'Visit the forums',
    },
    { href: 'https://www.netlify.com', title: 'Read the docs' },
    { href: 'https://www.netlify.com', title: 'Contact an expert' },
  ],
  steps: [
    {
      Description: (
        <li className="mb-20" key={1}>
          <strong>{'Deploy your first project.'}</strong> <Link>{'Connect to Git, choose a template'}</Link>
          {', or manually deploy'}
          {"a project you've been working on locally."}
        </li>
      ),
      id: 1,
    },
    {
      Description: (
        <li className="mb-20" key={2}>
          <strong>{'Check your deploy logs.'}</strong> {"Find out what's included in"}
          {'your build and watch for errors or failed deploys.'} {'deploys. '}
          <Link>{'Learn how to read your deploy logs'}</Link>
          {'.'}
        </li>
      ),
      id: 2,
    },
    {
      Description: (
        <li className="mb-20" key={3}>
          <strong>{'Choose an integration.'}</strong> {'Quickly discover, connect, and'}
          {'configure the right tools for your project with 150+ integrations to'}
          {'choose from. '}
          <Link>{'Explore the Integrations Hub'}</Link>
          {'.'}
        </li>
      ),
      id: 3,
    },
    {
      Description: (
        <li className="mb-20" key={4}>
          <strong>{'Set up a custom domain.'}</strong> {'You can register a new domain'}
          {'and buy it through Netlify or assign a domain you already own to your'}
          {'site. '}
          <Link>{'Add a custom domain'}</Link>
          {'.'}
        </li>
      ),
      id: 4,
    },
  ],
} satisfies NetlifyWelcomeEmailProps

export default NetlifyWelcomeEmail
