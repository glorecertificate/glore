'use client'

import { type Locale } from 'next-intl'

import { useArticle } from '@/components/features/docs/article-editor/context'
import { Tabs } from '@/components/ui/tabs'

export const ArticleEditorTabs = ({ children }: React.PropsWithChildren) => {
  const { language, setLanguage } = useArticle()

  return (
    <Tabs className="gap-0" onValueChange={value => setLanguage(value as Locale)} value={language}>
      {children}
    </Tabs>
  )
}
