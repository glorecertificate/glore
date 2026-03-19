import Link from 'next/link'

import { BookOpenIcon, CircleHelpIcon, GraduationCapIcon, MailIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import metadata from '~/config/metadata.json'

const RESOURCE_LINKS = [
  { icon: BookOpenIcon, key: 'intro', href: '/docs/intro', accent: 'text-brand border-brand/20 bg-brand/5' },
  { icon: CircleHelpIcon, key: 'faq', href: '/docs/faq', accent: 'text-info border-info/20 bg-info/5' },
  {
    icon: GraduationCapIcon,
    key: 'tutorials',
    href: '/docs/tutorials',
    accent: 'text-success border-success/20 bg-success/5',
  },
] as const

export const HelpContent = async () => {
  const t = await getTranslations('Help')

  return (
    <div className="flex flex-col gap-10 pt-6 pb-12">
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="max-w-2xl text-[15px] text-muted-foreground">{t('description')}</p>
      </section>

      {/* Getting started */}
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold tracking-tight">{t('gettingStarted.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('gettingStarted.description')}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(['step1', 'step2', 'step3'] as const).map((step, i) => (
            <div key={step} className="flex gap-4 rounded-xl border bg-card p-5 shadow-xs">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                {i + 1}
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{t(`gettingStarted.${step}.title`)}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(`gettingStarted.${step}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Resources */}
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold tracking-tight">{t('resources.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('resources.description')}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {RESOURCE_LINKS.map(({ accent, href, icon: Icon, key }) => (
            <Link key={key} href={href}>
              <Card className={`h-full gap-4 transition-shadow hover:shadow-sm ${accent}`}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`flex size-8 items-center justify-center rounded-lg border ${accent}`}>
                      <Icon className="size-4" />
                    </div>
                    <CardTitle className="text-sm">{t(`resources.${key}.title`)}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{t(`resources.${key}.description`)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section>
        <div className="flex items-start gap-4 rounded-xl border border-brand/20 bg-brand/5 p-6">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-brand/20 bg-brand/10 text-brand">
            <MailIcon className="size-4" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-medium">{t('contact.title')}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t.rich('contact.description', {
                email: chunks => (
                  <a className="text-link underline-offset-4 hover:underline" href={`mailto:${metadata.email}`}>
                    {chunks}
                  </a>
                ),
                website: chunks => (
                  <a
                    className="text-link underline-offset-4 hover:underline"
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
        </div>
      </section>
    </div>
  )
}
