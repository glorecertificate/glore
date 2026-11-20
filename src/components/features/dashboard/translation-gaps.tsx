import { useFormatter, useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { type TranslationGaps as TranslationGapsData } from '@/db/queries/content-translation'
import { LOCALES } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const GRID =
  'grid grid-cols-[minmax(0,1fr)_repeat(3,3.5rem)] items-center gap-x-2 sm:grid-cols-[minmax(0,1fr)_repeat(3,5rem)]'

export const TranslationGaps = ({ gaps }: { gaps: TranslationGapsData }) => {
  const t = useTranslations('Dashboard.editor')
  const tIntl = useTranslations('Intl.Languages')
  const { number } = useFormatter()
  const { kinds, missing, total } = gaps
  const share = (locale: (typeof LOCALES)[number]) => (total > 0 ? (total - missing[locale]) / total : 1)
  const shown = (locale: (typeof LOCALES)[number]) =>
    total > 0 ? Math.floor(((total - missing[locale]) * 100) / total) / 100 : 1

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('translationsTitle')}</CardTitle>
        <CardDescription>{t('translationsSubtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className={cn(GRID, 'gap-y-3 pt-1')}>
          <span aria-hidden />
          {LOCALES.map(locale => (
            <div className="flex flex-col items-center gap-0.5" key={locale}>
              <span className="text-sm text-foreground">{tIntl(locale)}</span>
              <span className="text-xl font-semibold text-foreground tabular-nums">
                {number(shown(locale), { maximumFractionDigits: 0, style: 'percent' })}
              </span>
            </div>
          ))}
          <span className="text-sm text-muted-foreground">{t('translationsTranslated')}</span>
          {LOCALES.map(locale => (
            <Progress
              aria-label={t('translationsProgressLabel', { language: tIntl(locale) })}
              color="warning"
              key={locale}
              value={share(locale) * 100}
            />
          ))}
        </div>

        <ul className="flex flex-1 flex-col border-t">
          {kinds.map(item => (
            <li className={cn(GRID, 'flex-1 border-b py-2.5')} key={item.kind}>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t(`translationsKind.${item.kind}`)}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {t('translationsInTotal', { count: item.total })}
                </p>
              </div>
              {LOCALES.map(locale => (
                <span className="flex items-center justify-center gap-1.5 text-sm tabular-nums" key={locale}>
                  {item.missing[locale] > 0 ? (
                    <>
                      <span aria-hidden className="size-2 shrink-0 rounded-full bg-status-changes" />
                      <span aria-hidden>{item.missing[locale]}</span>
                      <span className="sr-only">
                        {t('translationsMissingCell', {
                          count: item.missing[locale],
                          kind: t(`translationsKind.${item.kind}`),
                          language: tIntl(locale),
                        })}
                      </span>
                    </>
                  ) : (
                    <>
                      <LucideIcon aria-hidden className="size-3.5 text-muted-foreground" name="check" />
                      <span className="sr-only">
                        {t('translationsCompleteCell', {
                          kind: t(`translationsKind.${item.kind}`),
                          language: tIntl(locale),
                        })}
                      </span>
                    </>
                  )}
                </span>
              ))}
            </li>
          ))}
        </ul>

        <div className={cn(GRID, 'text-sm font-medium tabular-nums')}>
          <span className="text-xs text-muted-foreground">{t('translationsMissing')}</span>
          {LOCALES.map(locale => (
            <span className="text-center" key={locale}>
              <span aria-hidden>{missing[locale]}</span>
              <span className="sr-only">
                {t('translationsMissingTotal', { count: missing[locale], language: tIntl(locale) })}
              </span>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
