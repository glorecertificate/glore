import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Badge } from '@/components/ui/badge'
import { type TranslationRow } from '@/lib/translation-table'
import { cn } from '@/lib/utils'

import { TranslationCell } from './translation-cell'

export const TRANSLATION_GRID = 'md:grid-cols-[minmax(11rem,1fr)_repeat(3,minmax(0,2fr))]'

export const TranslationRowItem = ({
  className,
  locales,
  onOpen,
  row,
  ...props
}: Omit<React.ComponentProps<'tr'>, 'children'> & {
  locales: { label: string; value: string }[]
  onOpen: (key: string) => void
  row: TranslationRow
}) => {
  const t = useTranslations('Translations')

  return (
    <tr
      className={cn(
        'grid cursor-pointer gap-3 border-b p-3 transition-colors hover:bg-muted/40 md:items-start md:gap-4',
        TRANSLATION_GRID,
        className
      )}
      {...props}
    >
      <th className="flex min-w-0 flex-col items-start gap-1.5 text-left font-normal" scope="row">
        <button
          className="rounded-sm text-left font-mono text-xs break-all underline-offset-2 after:absolute after:inset-0 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          onClick={() => onOpen(row.key)}
          type="button"
        >
          {row.key}
        </button>
        {row.protected && (
          <Badge variant="muted">
            <LucideIcon name="lock" />
            {t('badges.protected')}
          </Badge>
        )}
      </th>
      {locales.map(({ label, value }) => {
        const cell = row.cells[value]
        return cell ? <TranslationCell cell={cell} key={value} label={label} /> : null
      })}
    </tr>
  )
}
