'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { LegalMarkdown } from '@/components/features/legal/legal-markdown'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type LegalVersionRow } from '@/db/queries/legal'
import { LOCALE_ITEMS } from '@/lib/i18n'

export const LegalVersionDialog = ({
  onOpenChange,
  version,
}: {
  onOpenChange: (open: boolean) => void
  version: LegalVersionRow | null
}) => {
  const t = useTranslations('LegalAdmin')
  const [locale, setLocale] = useState<string>(LOCALE_ITEMS[0]?.value ?? 'en')

  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(version)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('viewTitle', { version: version?.version ?? 0 })}</DialogTitle>
          <DialogDescription>{t('viewDescription')}</DialogDescription>
        </DialogHeader>
        <Tabs onValueChange={setLocale} value={locale}>
          <TabsList>
            {LOCALE_ITEMS.map(item => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {LOCALE_ITEMS.map(item => {
            const translation = version?.translations.find(row => row.locale === item.value)
            return (
              <TabsContent key={item.value} value={item.value}>
                {translation ? (
                  <>
                    <h3 className="text-lg font-semibold">{translation.title}</h3>
                    <LegalMarkdown>{translation.body}</LegalMarkdown>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('noTranslation')}</p>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
