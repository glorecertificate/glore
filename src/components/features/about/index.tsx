import {
  ArrowUpRightIcon,
  AwardIcon,
  CompassIcon,
  HeartIcon,
  HistoryIcon,
  LockIcon,
  NetworkIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCheckIcon,
} from 'lucide-react'
import { getMessages, getTranslations } from 'next-intl/server'

import { cn } from '@/lib/utils'
import metadata from '~/config/metadata.json'

interface TitledText {
  description: string
  title: string
}

const SECTIONS = [
  {
    icon: AwardIcon,
    key: 'mission',
    accent: 'text-brand',
    chip: 'bg-brand/10 text-brand',
    ring: 'border-brand/20 bg-brand/[0.03]',
  },
  {
    icon: CompassIcon,
    key: 'vision',
    accent: 'text-info',
    chip: 'bg-info/10 text-info',
    ring: 'border-info/20 bg-info/[0.03]',
  },
  {
    icon: HeartIcon,
    key: 'values',
    accent: 'text-brand-secondary-accent',
    chip: 'bg-brand-secondary/15 text-brand-secondary-accent',
    ring: 'border-brand-secondary/25 bg-brand-secondary/[0.04]',
  },
  {
    icon: NetworkIcon,
    key: 'network',
    accent: 'text-brand-tertiary',
    chip: 'bg-brand-tertiary/10 text-brand-tertiary',
    ring: 'border-brand-tertiary/20 bg-brand-tertiary/[0.03]',
  },
] as const

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

const TRUST_ITEMS = [
  { icon: UserCheckIcon, key: 'validation', chip: 'bg-brand/10 text-brand' },
  { icon: LockIcon, key: 'immutable', chip: 'bg-info/10 text-info' },
  { icon: QrCodeIcon, key: 'verifiable', chip: 'bg-brand-tertiary/10 text-brand-tertiary' },
] as const

export const AboutContent = async () => {
  const messages = (await getMessages()) as { About: AboutMessages }
  const t = await getTranslations('About')

  const content = messages.About
  const { howItWorks } = content
  const steps = [howItWorks.step1, howItWorks.step2, howItWorks.step3, howItWorks.step4].filter(
    (value): value is TitledText => Boolean(value)
  )

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-14 pt-8 pb-16">
      <section className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-brand/8 via-card to-brand-tertiary/5 p-8 sm:p-10">
        <div className="flex flex-col items-start gap-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-medium text-brand">
            <SparklesIcon className="size-3.5" />
            {content.intro.tagline}
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-[34px]">{content.title}</h1>
          <p className="max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground">{content.intro.body}</p>
        </div>
      </section>

      <section className="flex items-start gap-4 rounded-xl border bg-card p-6 shadow-2xs">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-tertiary/10 text-brand-tertiary">
          <HistoryIcon className="size-4.5" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-base font-semibold tracking-tight">{content.story.title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{content.story.description}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECTIONS.map(({ accent, chip, icon: Icon, key, ring }) => (
          <div key={key} className={cn('flex flex-col gap-3 rounded-xl border p-6 shadow-2xs', ring)}>
            <div className="flex items-center gap-3">
              <div className={cn('flex size-9 items-center justify-center rounded-lg', chip)}>
                <Icon className="size-4.5" />
              </div>
              <h2 className={cn('text-base font-semibold tracking-tight', accent)}>{content.sections[key].title}</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{content.sections[key].description}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-7">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-semibold tracking-tight">{content.howItWorks.title}</h2>
          <p className="text-sm text-muted-foreground">{content.howItWorks.description}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.title} className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-2xs">
              <span className="flex size-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-foreground tabular-nums">
                {i + 1}
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-7">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-semibold tracking-tight">{content.trust.title}</h2>
          <p className="text-sm text-muted-foreground">{content.trust.description}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {TRUST_ITEMS.map(({ chip, icon: Icon, key }) => {
            const item = content.trust.items[key]

            return (
              <div key={key} className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-2xs">
                <div className={cn('flex size-9 items-center justify-center rounded-lg', chip)}>
                  <Icon className="size-4.5" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-7">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-semibold tracking-tight">{content.skills.title}</h2>
          <p className="text-sm text-muted-foreground">{content.skills.description}</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {SKILL_KEYS.map(skill => (
            <span
              key={skill}
              className="inline-flex items-center rounded-full border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground/80 shadow-2xs"
            >
              {content.skills.items[skill]}
            </span>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-brand/20 bg-linear-to-br from-brand/10 via-card to-card p-7 sm:p-8">
        <div className="flex flex-col gap-5">
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
                })}
              </p>
            </div>
            <a
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-2xs transition-colors hover:bg-brand-accent"
              href={metadata.website}
              rel="noopener noreferrer"
              target="_blank"
            >
              {metadata.shortName}
              <ArrowUpRightIcon className="size-3.5" />
            </a>
          </div>
          <div className="flex items-center gap-2 border-t border-brand/15 pt-4 text-xs text-muted-foreground">
            <ShieldCheckIcon className="size-3.5 shrink-0" />
            {content.contact.coordinator}
          </div>
        </div>
      </section>
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
