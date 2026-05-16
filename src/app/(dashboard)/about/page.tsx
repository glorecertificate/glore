import { AwardIcon, EarthIcon, HeartIcon, MailIcon, NetworkIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { DashboardPage } from '@/components/layout/dashboard-page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { intlMetadata } from '@/lib/metadata'
import { cn } from '@/lib/utils'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'about',
  })

const ABOUT_SECTIONS = [
  { icon: AwardIcon, key: 'mission', accent: 'text-brand border-brand/20 bg-brand/5' },
  { icon: EarthIcon, key: 'vision', accent: 'text-info border-info/20 bg-info/5' },
  { icon: HeartIcon, key: 'values', accent: 'text-destructive border-destructive/20 bg-destructive/5' },
  { icon: NetworkIcon, key: 'network', accent: 'text-success border-success/20 bg-success/5' },
] as const

const AboutPage = async () => {
  const t = await getTranslations('About')

  return (
    <DashboardPage title={t('title')}>
      <div className="flex flex-col gap-10 pt-6 pb-12">
        <section className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="max-w-2xl text-[15px] text-muted-foreground">{t('description')}</p>
        </section>
        {/* Sections: mission, vision, values, network */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ABOUT_SECTIONS.map(({ accent, icon: Icon, key }) => (
            <Card key={key} className={cn('gap-4', accent)}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={cn('flex size-8 items-center justify-center rounded-lg border', accent)}>
                    <Icon className="size-4" />
                  </div>
                  <CardTitle className="text-sm">{t(`sections.${key}.title`)}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{t(`sections.${key}.description`)}</p>
              </CardContent>
            </Card>
          ))}
        </section>
        {/* How it works */}
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-semibold tracking-tight">{t('howItWorks.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('howItWorks.description')}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(['step1', 'step2', 'step3'] as const).map((step, i) => (
              <div key={step} className="flex gap-4 rounded-xl border bg-card p-5 shadow-xs">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{t(`howItWorks.${step}.title`)}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{t(`howItWorks.${step}.description`)}</p>
                </div>
              </div>
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
              <p className="text-sm leading-relaxed text-muted-foreground">{t('contact.description')}</p>
            </div>
          </div>
        </section>
      </div>
    </DashboardPage>
  )
}

export default AboutPage
