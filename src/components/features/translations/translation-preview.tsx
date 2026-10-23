'use client'

import { useId, useState } from 'react'

import { useTranslations } from 'next-intl'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type ArgumentSpec, argumentSpecs, renderPreview, sampleValues } from '@/lib/message-preview'

const INPUT_TYPES = {
  date: 'date',
  number: 'number',
  select: 'text',
  text: 'text',
} as const satisfies Record<ArgumentSpec['kind'], string>

export const TranslationPreview = ({ locale, source, value }: { locale: string; source: string; value: string }) => {
  const t = useTranslations('Translations.preview')
  const id = useId()
  const [samples, setSamples] = useState(() => sampleValues(source))
  const specs = argumentSpecs(source)
  const result = renderPreview({ locale, samples, source, value })

  const setSample = (name: string, sample: string) => setSamples(current => ({ ...current, [name]: sample }))

  return (
    <section aria-label={t('title')} className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
      <h4 className="text-sm font-medium">{t('title')}</h4>
      {result.ok ? (
        <p className="text-sm wrap-break-word whitespace-pre-wrap" data-testid="translation-preview" lang={locale}>
          {result.text}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">{t('unavailable')}</p>
      )}
      {specs.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {specs.map(spec => (
            <div className="flex flex-col gap-1" key={spec.name}>
              <Label className="text-xs text-muted-foreground" htmlFor={`${id}-${spec.name}`}>
                {t('sample', { name: spec.name })}
              </Label>
              {spec.kind === 'select' ? (
                <Select onValueChange={sample => setSample(spec.name, sample)} value={samples[spec.name] ?? ''}>
                  <SelectTrigger className="h-8 w-full" id={`${id}-${spec.name}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {spec.options.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`${id}-${spec.name}`}
                  onChange={event => setSample(spec.name, event.target.value)}
                  size="sm"
                  type={INPUT_TYPES[spec.kind]}
                  value={samples[spec.name] ?? ''}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
