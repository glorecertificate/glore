import { getMessages, getTranslations } from 'next-intl/server'

import { InfoCard, InfoSection, type InfoTone } from '@/components/features/about/blocks'
import { LucideIcon } from '@/components/icons/lucide'
import { type IconName } from '@/components/icons/registry'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SOCIAL_LABELS, socialLinks } from '@/lib/app-settings'
import { loadSettings } from '@/lib/settings'
import metadata from '~/config/metadata.json'

interface TitledText {
  description: string
  title: string
}

const SECTIONS: { icon: IconName; key: 'mission' | 'network' | 'values' | 'vision'; tone: InfoTone }[] = [
  { icon: 'award', key: 'mission', tone: 'action' },
  { icon: 'compass', key: 'vision', tone: 'info' },
  { icon: 'heart', key: 'values', tone: 'earned' },
  { icon: 'network', key: 'network', tone: 'navy' },
]

const SKILL_KEYS = [
  'problemSolving',
  'communication',
  'conflict',
  'empathy',
  'organization',
  'creativity',
  'teamwork',
  'leadership',
] as const

const TRUST_ITEMS: { icon: IconName; key: string; tone: InfoTone }[] = [
  { icon: 'user-check', key: 'validation', tone: 'action' },
  { icon: 'lock', key: 'immutable', tone: 'info' },
  { icon: 'qr-code', key: 'verifiable', tone: 'navy' },
]

const LINK = 'font-medium text-link underline underline-offset-4 hover:text-brand-text focus-visible:focus-ring'

export const AboutContent = async () => {
  const messages = (await getMessages()) as { About: AboutMessages }
  const [t, settings] = await Promise.all([getTranslations('About'), loadSettings()])
  const links = socialLinks(settings)

  const content = messages.About
  const { howItWorks } = content
  const steps = [howItWorks.step1, howItWorks.step2, howItWorks.step3, howItWorks.step4].filter(
    (value): value is TitledText => Boolean(value)
  )

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-3">
        <p className="type-label text-action-text">{content.intro.tagline}</p>
        <p className="max-w-prose text-lg/8 text-pretty text-fg-1">{content.intro.body}</p>
      </section>

      <section className="flex flex-col gap-4 border-t pt-8 sm:flex-row sm:gap-8">
        <h2 className="shrink-0 type-heading text-fg-title sm:w-40">{content.story.title}</h2>
        <p className="max-w-prose text-base/7 text-pretty text-fg-2">{content.story.description}</p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECTIONS.map(({ icon, key, tone }) => (
          <InfoCard
            description={content.sections[key].description}
            icon={icon}
            key={key}
            title={content.sections[key].title}
            tone={tone}
          />
        ))}
      </section>

      <InfoSection description={content.howItWorks.description} title={content.howItWorks.title}>
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li className="flex" key={step.title}>
              <Card className="size-full gap-4">
                <span
                  aria-hidden
                  className="flex size-8 items-center justify-center rounded-full bg-action text-sm font-semibold text-fg-on-fill tabular-nums"
                >
                  {index + 1}
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="type-heading text-fg-1">{step.title}</h3>
                  <p className="text-sm/relaxed text-pretty text-fg-2">{step.description}</p>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </InfoSection>

      <InfoSection description={content.trust.description} title={content.trust.title}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {TRUST_ITEMS.map(({ icon, key, tone }) => (
            <InfoCard
              description={content.trust.items[key]?.description ?? ''}
              icon={icon}
              key={key}
              title={content.trust.items[key]?.title ?? ''}
              tone={tone}
            />
          ))}
        </div>
      </InfoSection>

      <InfoSection description={content.skills.description} title={content.skills.title}>
        <ul className="flex flex-wrap gap-2">
          {SKILL_KEYS.map(skill => (
            <li
              className="inline-flex items-center rounded-full border bg-card px-3 py-1.5 text-sm font-medium text-fg-1"
              key={skill}
            >
              {content.skills.items[skill]}
            </li>
          ))}
        </ul>
      </InfoSection>

      <Card className="gap-5 bg-surface-sunken p-6 shadow-none sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <h2 className="font-display text-xl font-semibold tracking-tight text-fg-title">{content.contact.title}</h2>
            <p className="max-w-prose text-sm/relaxed text-pretty text-fg-2">
              {t.rich('contact.description', {
                email: chunks => (
                  <a className={LINK} href={`mailto:${settings.email}`}>
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </div>
          <Button asChild className="shrink-0">
            <a href={settings.website} rel="noopener noreferrer" target="_blank">
              {metadata.shortName}
              <LucideIcon name="arrow-up-right" />
            </a>
          </Button>
        </div>
        <div className="flex items-center gap-2 border-t pt-4 text-sm text-fg-2">
          <LucideIcon name="shield-check" className="size-4 shrink-0" />
          {content.contact.coordinator}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <a className={`inline-flex items-center gap-1.5 ${LINK}`} href={`tel:${settings.phone}`}>
            <LucideIcon name="phone" className="size-4 shrink-0" />
            {settings.phone}
          </a>
          {links.map(({ href, platform }) => (
            <a className={LINK} href={href} key={platform} rel="noopener noreferrer" target="_blank">
              {SOCIAL_LABELS[platform]}
            </a>
          ))}
        </div>
      </Card>
    </div>
  )
}

interface AboutMessages {
  contact: {
    coordinator: string
    description: string
    title: string
  }
  howItWorks: {
    description: string
    step1: TitledText
    step2: TitledText
    step3: TitledText
    step4?: TitledText
    title: string
  }
  intro: {
    body: string
    tagline: string
  }
  sections: Record<'mission' | 'vision' | 'values' | 'network', TitledText>
  skills: {
    description: string
    items: Record<string, string>
    title: string
  }
  story: TitledText
  title: string
  trust: {
    description: string
    items: Record<string, TitledText>
    title: string
  }
}
