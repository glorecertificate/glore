import { useTranslations } from 'next-intl'

import { type TranslationCell as Cell, effectiveText } from '@/lib/translation-table'

import { TranslationBadges } from './translation-badges'

export const TranslationCell = ({ cell, label }: { cell: Cell; label: string }) => {
  const t = useTranslations('Translations.cell')
  const text = effectiveText(cell)

  return (
    <td className="flex min-w-0 flex-col gap-1">
      <span className="text-xs text-muted-foreground md:hidden">{label}</span>
      {text === null ? (
        <span className="text-sm text-muted-foreground italic">{t('missing')}</span>
      ) : (
        <p className="line-clamp-3 text-sm wrap-break-word">{text}</p>
      )}
      {cell.published !== null && cell.bundled !== null && (
        <p className="line-clamp-1 text-xs wrap-break-word text-muted-foreground">
          {t('default', { text: cell.bundled })}
        </p>
      )}
      {cell.draft !== null && (
        <p className="line-clamp-2 rounded-sm bg-info/10 px-1.5 py-0.5 text-xs wrap-break-word text-info-text">
          {t('draft', { text: cell.draft })}
        </p>
      )}
      <div className="flex flex-wrap gap-1 empty:hidden">
        <TranslationBadges cell={cell} />
      </div>
    </td>
  )
}
