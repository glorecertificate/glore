import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import { type StaleState } from '@/lib/message-validation'
import { type TranslationCell } from '@/lib/translation-table'

const STALE_VARIANTS = {
  incompatible: 'destructive',
  orphaned: 'destructive',
  outdated: 'warning',
  redundant: 'muted',
} as const satisfies Record<StaleState, React.ComponentProps<typeof Badge>['variant']>

export const TranslationBadges = ({ cell }: { cell: TranslationCell }) => {
  const t = useTranslations('Translations.badges')

  return (
    <>
      {cell.published !== null && <Badge variant="brand-soft">{t('edited')}</Badge>}
      {cell.draft !== null && <Badge variant="info">{cell.origin === 'machine' ? t('aiDraft') : t('draft')}</Badge>}
      {cell.stale && <Badge variant={STALE_VARIANTS[cell.stale]}>{t(cell.stale)}</Badge>}
    </>
  )
}
