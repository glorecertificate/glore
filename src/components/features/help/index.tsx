'use client'

import {
  ArrowUpRightIcon,
  BadgeCheckIcon,
  BellIcon,
  BookMarkedIcon,
  BuildingIcon,
  ClipboardCheckIcon,
  CompassIcon,
  FileCheckIcon,
  FilePlus2Icon,
  GraduationCapIcon,
  InboxIcon,
  LayersIcon,
  type LucideIcon,
  MailIcon,
  PencilRulerIcon,
  RefreshCwIcon,
  RocketIcon,
  ScaleIcon,
  ScrollTextIcon,
  SearchCheckIcon,
  SettingsIcon,
  SmartphoneIcon,
  SparklesIcon,
  SquareStackIcon,
  UserCogIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react'
import { useMessages, useTranslations } from 'next-intl'

import { Faq } from '@/components/features/help/faq'
import { type HelpRole, useHelpRole } from '@/components/features/help/use-help-role'
import { cn } from '@/lib/utils'
import metadata from '~/config/metadata.json'

interface TitledText {
  description: string
  title: string
}

const STEP_ACCENTS = [
  'bg-brand text-brand-foreground',
  'bg-brand-secondary text-brand-secondary-foreground',
  'bg-info text-info-foreground',
  'bg-brand-tertiary text-brand-tertiary-foreground',
] as const

const STEP_ICONS: Record<HelpRole, [LucideIcon, LucideIcon, LucideIcon, LucideIcon]> = {
  volunteer: [UsersIcon, GraduationCapIcon, SparklesIcon, ClipboardCheckIcon],
  learner: [UsersIcon, CompassIcon, BadgeCheckIcon, GraduationCapIcon],
  tutor: [InboxIcon, SearchCheckIcon, PencilRulerIcon, FileCheckIcon],
  manager: [UserPlusIcon, UsersIcon, ScaleIcon, BuildingIcon],
  team: [FilePlus2Icon, LayersIcon, RocketIcon, SettingsIcon],
}

const CERTIFICATE_FACETS = [
  { icon: BadgeCheckIcon, key: 'eligibility', chip: 'bg-brand/10 text-brand' },
  { icon: RefreshCwIcon, key: 'lifecycle', chip: 'bg-info/10 text-info' },
  { icon: ScrollTextIcon, key: 'verification', chip: 'bg-brand-tertiary/10 text-brand-tertiary' },
] as const

const FEATURE_ICONS: Record<string, LucideIcon> = {
  organizations: SquareStackIcon,
  onboarding: UserCogIcon,
  settings: BookMarkedIcon,
  documentation: ScrollTextIcon,
  notifications: BellIcon,
  pwa: SmartphoneIcon,
}

export const HelpContent = () => {
  const messages = useMessages() as { Help: HelpMessages }
  const t = useTranslations('Help')
  const role = useHelpRole()

  const content = messages.Help
  const roleContent = content.roles[role]
  const steps = Object.values(roleContent.steps)
  const faqItems = Object.values(roleContent.faqs)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-14 pt-8 pb-16">
      <section className="flex flex-col items-center gap-3 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-medium text-brand">
          <BadgeCheckIcon className="size-3.5" />
          {roleContent.label}
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-[34px]">{content.title}</h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-balance text-muted-foreground">{roleContent.intro}</p>
      </section>

      <section className="flex flex-col gap-7">
        <h2 className="text-xl font-semibold tracking-tight">{content.gettingStartedTitle}</h2>
        <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {steps.map((step, i) => {
            const Icon = STEP_ICONS[role][i]

            return (
              <li
                key={step.title}
                className="flex gap-4 rounded-xl border bg-card p-5 shadow-2xs transition-shadow hover:shadow-sm"
              >
                <div className="flex flex-col items-center gap-2">
                  <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', STEP_ACCENTS[i])}>
                    <Icon className="size-5" />
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground/60 tabular-nums">{`0${i + 1}`}</span>
                </div>
                <div className="flex flex-col gap-1 pt-0.5">
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="flex flex-col gap-7">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-semibold tracking-tight">{content.certificate.title}</h2>
          <p className="text-sm text-muted-foreground">{content.certificate.description}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CERTIFICATE_FACETS.map(({ chip, icon: Icon, key }) => {
            const facet = content.certificate[key]

            return (
              <div key={key} className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-2xs">
                <div className={cn('flex size-9 items-center justify-center rounded-lg', chip)}>
                  <Icon className="size-4.5" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold">{facet.title}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{facet.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-7">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-semibold tracking-tight">{content.faqsTitle}</h2>
          <p className="text-sm text-muted-foreground">{content.faqsDescription}</p>
        </div>
        <Faq items={faqItems} />
      </section>

      <section className="flex flex-col gap-7">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-semibold tracking-tight">{content.features.title}</h2>
          <p className="text-sm text-muted-foreground">{content.features.description}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(content.features.items).map(([key, item]) => {
            const Icon = FEATURE_ICONS[key] ?? SquareStackIcon

            return (
              <div key={key} className="flex gap-3 rounded-xl border bg-card p-4 shadow-2xs">
                <Icon className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-brand/20 bg-linear-to-br from-brand/10 via-card to-card p-7 sm:p-8">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-semibold tracking-tight">{content.contact.title}</h2>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              {t.rich('contact.description', {
                email: chunks => (
                  <a
                    className="font-medium text-link underline-offset-4 hover:underline"
                    href={`mailto:${metadata.email}`}
                  >
                    {chunks}
                  </a>
                ),
                website: chunks => (
                  <a
                    className="font-medium text-link underline-offset-4 hover:underline"
                    href={metadata.website}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <a
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-2xs transition-colors hover:bg-brand-accent"
              href={`mailto:${metadata.email}`}
            >
              <MailIcon className="size-4" />
              {content.contact.emailLabel}
            </a>
            <a
              className="inline-flex items-center gap-1.5 px-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              href={metadata.website}
              rel="noopener noreferrer"
              target="_blank"
            >
              {content.contact.websiteLabel}
              <ArrowUpRightIcon className="size-3.5" />
            </a>
          </div>
        </div>
      </section>
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
