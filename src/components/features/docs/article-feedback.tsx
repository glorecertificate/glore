'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { useSettings } from '@/components/providers/settings'
import { Button } from '@/components/ui/button'

export const ArticleFeedback = ({ title }: { title: string }) => {
  const t = useTranslations('Docs.article')
  const { email } = useSettings()
  const [answer, setAnswer] = useState<'no' | 'yes' | null>(null)

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-border-subtle pt-6" data-slot="article-feedback">
      <p className="type-label text-fg-1">{t('helpful')}</p>
      {answer === null && (
        <div className="flex items-center gap-2">
          <Button onClick={() => setAnswer('yes')} size="sm" type="button" variant="outline">
            {t('yes')}
          </Button>
          <Button onClick={() => setAnswer('no')} size="sm" type="button" variant="outline">
            {t('no')}
          </Button>
        </div>
      )}
      {answer === 'yes' && <output className="text-sm text-fg-2">{t('thanks')}</output>}
      {answer === 'no' && (
        <Button asChild size="sm" variant="outline">
          <a href={`mailto:${email}?subject=${encodeURIComponent(title)}`}>{t('tellUs')}</a>
        </Button>
      )}
    </div>
  )
}
