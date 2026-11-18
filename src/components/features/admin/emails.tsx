'use client'

import { startTransition, useId } from 'react'

import { useTranslations } from 'next-intl'
import { useQueryStates } from 'nuqs'

import { EMAIL_PREVIEW_CATEGORIES, emailPreviewParsers } from '@/components/features/admin/emails-params'
import { Banner } from '@/components/ui/banner'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { SegmentedControlItem } from '@/components/ui/segmented-control-item'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LOCALES } from '@/lib/i18n'

const NO_CATEGORY = 'none'

interface AdminEmailsProps {
  html: string | null
  subject: string | null
  template: string
  templates: string[]
}

export const AdminEmails = ({ html, subject, template, templates }: AdminEmailsProps) => {
  const t = useTranslations('AdminEmails')
  const tLanguages = useTranslations('Intl.Languages')
  const templateId = useId()
  const categoryId = useId()
  const [{ category, lang }, setParams] = useQueryStates(emailPreviewParsers, {
    clearOnDefault: true,
    shallow: false,
    startTransition,
  })

  return (
    <Card className="gap-4 p-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-60 flex-col gap-1.5">
          <Label htmlFor={templateId}>{t('template')}</Label>
          <Select onValueChange={value => setParams({ template: value })} value={template}>
            <SelectTrigger className="w-full" id={templateId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {templates.map(name => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t('locale')}</Label>
          <SegmentedControl
            aria-label={t('locale')}
            onValueChange={value => setParams({ lang: value as (typeof LOCALES)[number] })}
            value={lang}
          >
            {LOCALES.map(locale => (
              <SegmentedControlItem key={locale} value={locale}>
                {tLanguages(locale)}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </div>

        <div className="flex min-w-48 flex-col gap-1.5">
          <Label htmlFor={categoryId}>{t('category')}</Label>
          <Select
            onValueChange={value =>
              setParams({
                category: value === NO_CATEGORY ? null : (value as (typeof EMAIL_PREVIEW_CATEGORIES)[number]),
              })
            }
            value={category ?? NO_CATEGORY}
          >
            <SelectTrigger className="w-full" id={categoryId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CATEGORY}>{t('category_none')}</SelectItem>
              {EMAIL_PREVIEW_CATEGORIES.map(value => (
                <SelectItem key={value} value={value}>
                  {t(`category_${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {html === null || subject === null ? (
        <Banner role="alert" variant="destructive">
          {t('renderError')}
        </Banner>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <p className="border-b px-4 py-3 type-label">{t('subject', { subject })}</p>
          <div className="overflow-x-auto">
            <iframe className="h-176 w-full min-w-160" sandbox="" srcDoc={html} title={t('frameTitle', { template })} />
          </div>
        </div>
      )}
    </Card>
  )
}
