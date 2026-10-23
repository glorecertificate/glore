'use client'

import { useTranslations } from 'next-intl'
import { parseAsStringEnum, useQueryState } from 'nuqs'

import { LegalDocumentPanel } from '@/components/features/legal/legal-document-panel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type LegalDocument, type LegalDocumentRow } from '@/db/queries/legal'
import { LEGAL_DOCUMENTS } from '@/lib/constants'

const KEYS = { privacy: 'privacy', 'quality-charter': 'qualityCharter', terms: 'terms' } as const

const ORDER: LegalDocument[] = ['terms', 'privacy', 'quality-charter']

const documentParser = parseAsStringEnum([...LEGAL_DOCUMENTS]).withDefault('terms')

export const LegalManager = ({ canPublish, documents }: { canPublish: boolean; documents: LegalDocumentRow[] }) => {
  const t = useTranslations('LegalAdmin')
  const [slug, setSlug] = useQueryState('document', documentParser)
  const ordered = documents.toSorted((a, b) => ORDER.indexOf(a.slug) - ORDER.indexOf(b.slug))

  return (
    <Tabs onValueChange={value => setSlug(value as LegalDocument)} value={slug}>
      <TabsList>
        {ordered.map(document => (
          <TabsTrigger key={document.slug} value={document.slug}>
            {t(`documents.${KEYS[document.slug]}`)}
          </TabsTrigger>
        ))}
      </TabsList>
      {ordered.map(document => (
        <TabsContent className="mt-4 space-y-6" key={document.slug} value={document.slug}>
          <LegalDocumentPanel canPublish={canPublish} document={document} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
