'use client'

import { startTransition, useId } from 'react'

import { useTranslations } from 'next-intl'
import { useQueryStates } from 'nuqs'

import { EMAIL_PREVIEW_CATEGORIES, emailPreviewParsers } from '@/components/features/admin/emails-params'
import { Banner } from '@/components/ui/banner'
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-60 flex-col gap-1.5">
          <Label htmlFor={templateId}>{t('template')}</Label>
          <Select onValueChange={value => setParams({ template: value })} value={template}>
            <SelectTrigger id={templateId}>
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
            <SelectTrigger id={categoryId}>
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
        <>
          <p className="text-sm font-medium">{t('subject', { subject })}</p>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <iframe
              className="h-[75vh] w-full min-w-160"
              sandbox=""
              srcDoc={html}
              title={t('frameTitle', { template })}
            />
          </div>
        </>
      )}
    </div>
  )
}
