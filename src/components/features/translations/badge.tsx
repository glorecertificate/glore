'use client'

import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import { type TranslationState } from '@/db/queries/content-translation'

const VARIANTS = {
  draft: 'warning',
  machine: 'info',
  missing: 'muted',
  outdated: 'destructive',
  reviewed: 'success',
} as const satisfies Record<TranslationState, React.ComponentProps<typeof Badge>['variant']>

export const TranslationBadge = ({
  state,
  ...props
}: Omit<React.ComponentProps<typeof Badge>, 'children' | 'variant'> & { state: TranslationState }) => {
  const t = useTranslations('ContentTranslation.state')

  return (
    <Badge data-state={state} variant={VARIANTS[state]} {...props}>
      {t(state)}
    </Badge>
  )
}
