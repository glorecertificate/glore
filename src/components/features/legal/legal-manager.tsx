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

export const LegalTabs = (props: React.ComponentProps<typeof Tabs>) => {
  const [slug, setSlug] = useQueryState('document', documentParser)

  return <Tabs className="gap-0" onValueChange={value => setSlug(value as LegalDocument)} value={slug} {...props} />
}

export const LegalTabsList = () => {
  const t = useTranslations('LegalAdmin')

  return (
    <TabsList className="max-w-full min-w-0 justify-start overflow-x-auto">
      {ORDER.map(slug => (
        <TabsTrigger key={slug} value={slug}>
          {t(`documents.${KEYS[slug]}`)}
        </TabsTrigger>
      ))}
    </TabsList>
  )
}

export const LegalManager = ({ canPublish, documents }: { canPublish: boolean; documents: LegalDocumentRow[] }) => {
  const ordered = documents.toSorted((a, b) => ORDER.indexOf(a.slug) - ORDER.indexOf(b.slug))

  return ordered.map(document => (
    <TabsContent className="space-y-6" key={document.slug} value={document.slug}>
      <LegalDocumentPanel canPublish={canPublish} document={document} />
    </TabsContent>
  ))
}
