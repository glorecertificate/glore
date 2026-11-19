'use client'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const SettingsSaveBar = ({
  className,
  dirty,
  loading,
  onReset,
  ...props
}: Omit<React.ComponentProps<'div'>, 'children'> & {
  dirty: boolean
  loading?: boolean
  onReset: () => void
}) => {
  const t = useTranslations('Users')
  if (!dirty && !loading) return null

  return (
    <div
      className={cn(
        'sticky bottom-0 z-20 -mx-4 mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle bg-canvas/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border',
        className
      )}
      data-slot="settings-save-bar"
      {...props}
    >
      <output className="text-sm text-muted-foreground">{t('unsavedChanges')}</output>
      <div className="flex items-center gap-2">
        <Button disabled={loading} onClick={onReset} type="button" variant="outline">
          {t('reset')}
        </Button>
        <Button loading={loading} type="submit" variant="brand">
          {t('saveChanges')}
        </Button>
      </div>
    </div>
  )
}
