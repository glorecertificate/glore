'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import { useSession } from '@/components/providers/session'
import { Banner } from '@/components/ui/banner'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DEFAULT_LOCALE } from '@/lib/i18n'
import { type TranslationRow, canEditKey } from '@/lib/translation-table'

import { LocaleEditor } from './locale-editor'
import { TranslationBadges } from './translation-badges'

export const TranslationEditor = ({
  onChanged,
  onClose,
  row,
}: {
  onChanged: () => Promise<void>
  onClose: () => void
  row: TranslationRow
}) => {
  const t = useTranslations('Translations.editor')
  const { locale: uiLocale, localeItems } = useI18n()
  const { user } = useSession()
  const [tab, setTab] = useState<string>(uiLocale)
  const canEdit = canEditKey(row.key, user.isAdmin)
  const source = row.cells[DEFAULT_LOCALE]?.bundled ?? null

  return (
    <Sheet onOpenChange={open => !open && onClose()} open>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-2xl" closeSrText={t('close')}>
        <SheetHeader>
          <SheetTitle className="font-mono text-base break-all">{row.key}</SheetTitle>
          <SheetDescription>{t('description')}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-6">
          {!canEdit && (
            <Banner>
              <LucideIcon className="mt-0.5 size-4 shrink-0" name="lock" />
              <p>{t('protectedNotice')}</p>
            </Banner>
          )}
          {source !== null && (
            <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-3">
              <span className="text-xs font-medium text-muted-foreground">{t('source')}</span>
              <p className="text-sm wrap-break-word whitespace-pre-wrap" lang={DEFAULT_LOCALE}>
                {source}
              </p>
            </div>
          )}
          <Tabs onValueChange={setTab} value={tab}>
            <TabsList className="min-w-0 justify-start">
              {localeItems.map(({ label, value }) => (
                <TabsTrigger key={value} value={value}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            {localeItems.map(({ label, value }) => {
              const cell = row.cells[value]
              return (
                <TabsContent className="flex flex-col gap-3 pt-2" key={value} value={value}>
                  {cell && (
                    <>
                      <div className="flex flex-wrap gap-1 empty:hidden">
                        <TranslationBadges cell={cell} />
                      </div>
                      <LocaleEditor
                        canEdit={canEdit}
                        cell={cell}
                        isAdmin={user.isAdmin}
                        key={`${row.key}:${value}:${cell.draft ?? ''}:${cell.published ?? ''}:${cell.stale ?? ''}`}
                        label={label}
                        locale={value}
                        messageKey={row.key}
                        onChanged={onChanged}
                        source={source}
                      />
                    </>
                  )}
                </TabsContent>
              )
            })}
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
