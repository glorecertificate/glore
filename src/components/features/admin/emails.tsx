'use client'

import { startTransition, useId, useLayoutEffect, useRef, useState } from 'react'

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

const FRAME_WIDTHS = { desktop: 640, phone: 390 }

const FRAME_HEIGHT = 'min(44rem, 75vh)'

type Device = keyof typeof FRAME_WIDTHS

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
  const frameRef = useRef<HTMLDivElement>(null)
  const [device, setDevice] = useState<Device>('phone')
  const [available, setAvailable] = useState(0)
  const [{ category, lang }, setParams] = useQueryStates(emailPreviewParsers, {
    clearOnDefault: true,
    shallow: false,
    startTransition,
  })

  const width = FRAME_WIDTHS[device]
  const scale = available > 0 ? Math.min(1, available / width) : 1

  useLayoutEffect(() => {
    const element = frameRef.current
    if (!element) return
    const measure = () => setAvailable(element.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [html])

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

        <div className="flex flex-col gap-1.5">
          <Label>{t('device')}</Label>
          <SegmentedControl
            aria-label={t('device')}
            onValueChange={value => value && setDevice(value as Device)}
            value={device}
          >
            <SegmentedControlItem value="phone">{t('devicePhone')}</SegmentedControlItem>
            <SegmentedControlItem value="desktop">{t('deviceDesktop')}</SegmentedControlItem>
          </SegmentedControl>
        </div>
      </div>

      {html === null || subject === null ? (
        <Banner role="alert" variant="destructive">
          {t('renderError')}
        </Banner>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <p className="border-b px-4 py-3 type-label">{t('subject', { subject })}</p>
          <div className="overflow-hidden bg-surface-muted" ref={frameRef} style={{ height: FRAME_HEIGHT }}>
            <div
              className="origin-top-left"
              style={{
                height: `calc(${FRAME_HEIGHT} / ${scale})`,
                marginInline: scale < 1 ? 0 : 'auto',
                scale,
                width: `${width}px`,
              }}
            >
              <iframe className="size-full bg-white" sandbox="" srcDoc={html} title={t('frameTitle', { template })} />
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
