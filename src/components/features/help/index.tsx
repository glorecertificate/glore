'use client'

import { useMessages, useTranslations } from 'next-intl'

import { InfoCard } from '@/components/features/about/info-card'
import { InfoSection } from '@/components/features/about/info-section'
import { type InfoTone } from '@/components/features/about/info-tone'
import { Faq } from '@/components/features/help/faq'
import { type HelpRole, useHelpRole } from '@/components/features/help/use-help-role'
import { LucideIcon } from '@/components/icons/lucide'
import { type IconName } from '@/components/icons/registry'
import { useSettings } from '@/components/providers/settings'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface TitledText {
  description: string
  title: string
}

const STEP_TONES: InfoTone[] = ['action', 'earned', 'info', 'navy']

const STEP_ICONS: Record<HelpRole, [IconName, IconName, IconName, IconName]> = {
  volunteer: ['users', 'graduation-cap', 'sparkles', 'clipboard-check'],
  learner: ['users', 'compass', 'badge-check', 'graduation-cap'],
  tutor: ['inbox', 'search-check', 'pencil-ruler', 'file-check'],
  manager: ['user-plus', 'users', 'scale', 'building'],
  team: ['file-plus-corner', 'layers', 'rocket', 'settings'],
}

const CERTIFICATE_FACETS: { icon: IconName; key: 'eligibility' | 'lifecycle' | 'verification'; tone: InfoTone }[] = [
  { icon: 'badge-check', key: 'eligibility', tone: 'action' },
  { icon: 'refresh-cw', key: 'lifecycle', tone: 'info' },
  { icon: 'scroll-text', key: 'verification', tone: 'navy' },
]

const FEATURE_ICONS: Record<string, IconName> = {
  organizations: 'square-stack',
  onboarding: 'user-cog',
  settings: 'book-marked',
  documentation: 'scroll-text',
  notifications: 'bell',
  pwa: 'smartphone',
}

const LINK = 'font-medium text-link underline underline-offset-4 hover:text-brand-text focus-visible:focus-ring'

export const HelpContent = () => {
  const messages = useMessages() as { Help: HelpMessages }
  const t = useTranslations('Help')
  const role = useHelpRole()
  const { email, website } = useSettings()

  const content = messages.Help
  const roleContent = content.roles[role]
  const steps = Object.values(roleContent.steps)
  const faqItems = Object.values(roleContent.faqs)

  return (
    <div className="flex flex-col gap-12">
      <InfoSection title={content.gettingStartedTitle}>
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <li className="flex" key={step.title}>
              <InfoCard
                className="w-full"
                description={step.description}
                icon={STEP_ICONS[role][index]}
                title={`${index + 1}. ${step.title}`}
                tone={STEP_TONES[index]}
              />
            </li>
          ))}
        </ol>
      </InfoSection>

      <InfoSection description={content.certificate.description} title={content.certificate.title}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CERTIFICATE_FACETS.map(({ icon, key, tone }) => (
            <InfoCard
              description={content.certificate[key].description}
              icon={icon}
              key={key}
              title={content.certificate[key].title}
              tone={tone}
            />
          ))}
        </div>
      </InfoSection>

      <InfoSection description={content.faqsDescription} title={content.faqsTitle}>
        <Faq items={faqItems} />
      </InfoSection>

      <InfoSection description={content.features.description} title={content.features.title}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(content.features.items).map(([key, item]) => (
            <InfoCard
              description={item.description}
              icon={FEATURE_ICONS[key] ?? 'square-stack'}
              key={key}
              title={item.title}
              tone="navy"
            />
          ))}
        </div>
      </InfoSection>

      <Card className="gap-5 bg-surface-sunken p-6 shadow-none sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <h2 className="font-display text-xl font-semibold tracking-tight text-fg-title">{content.contact.title}</h2>
            <p className="max-w-prose text-sm/relaxed text-pretty text-fg-2">
              {t.rich('contact.description', {
                email: chunks => (
                  <a className={LINK} href={`mailto:${email}`}>
                    {chunks}
                  </a>
                ),
                website: chunks => (
                  <a className={LINK} href={website} rel="noopener noreferrer" target="_blank">
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button asChild>
              <a href={`mailto:${email}`}>
                <LucideIcon name="mail" />
                {content.contact.emailLabel}
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={website} rel="noopener noreferrer" target="_blank">
                {content.contact.websiteLabel}
                <LucideIcon name="arrow-up-right" />
              </a>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

interface HelpMessages {
  certificate: {
    description: string
    eligibility: TitledText
    lifecycle: TitledText
    title: string
    verification: TitledText
  }
  contact: {
    description: string
    emailLabel: string
    title: string
    websiteLabel: string
  }
  faqsDescription: string
  faqsTitle: string
  features: {
    description: string
    items: Record<string, TitledText>
    title: string
  }
  gettingStartedTitle: string
  roles: Record<
    HelpRole,
    {
      faqs: Record<string, { answer: string; question: string }>
      intro: string
      label: string
      steps: Record<string, TitledText>
    }
  >
  title: string
}
