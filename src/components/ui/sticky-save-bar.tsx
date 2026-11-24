'use client'

import { useTranslations } from 'next-intl'
import { type FieldValues, type UseFormReturn, useFormState } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const countDirty = (value: unknown): number => {
  if (value === true) return 1
  if (Array.isArray(value)) return value.reduce<number>((total, item) => total + countDirty(item), 0)
  if (value && typeof value === 'object') {
    return Object.values(value).reduce<number>((total, item) => total + countDirty(item), 0)
  }
  return 0
}

export const useStickySaveBar = <T extends FieldValues>(form: UseFormReturn<T>) => {
  const { dirtyFields, isSubmitting } = useFormState({ control: form.control })
  const count = countDirty(dirtyFields)

  return {
    count,
    dirtyFields,
    discard: () => form.reset(),
    saving: isSubmitting,
    visible: count > 0,
  }
}

interface StickySaveBarProps extends Omit<React.ComponentProps<'div'>, 'onReset'> {
  count: number
  form?: string
  onDiscard: () => void
  onSave?: () => void
  saving?: boolean
  visible?: boolean
}

export const StickySaveBar = ({
  className,
  count,
  form,
  onDiscard,
  onSave,
  saving = false,
  visible = count > 0,
  ...props
}: StickySaveBarProps) => {
  const t = useTranslations('Common')

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        'sticky bottom-0 z-10 -mx-4 mt-6 flex items-center gap-3 border-t border-border-subtle bg-surface-1/95 px-4 pt-3 pb-bar-safe backdrop-blur transition-[opacity,display] transition-discrete duration-150 ease-out motion-reduce:transition-none sm:mx-0 sm:rounded-b-xl',
        visible ? 'opacity-100 starting:opacity-0' : 'pointer-events-none hidden opacity-0',
        className
      )}
      data-slot="sticky-save-bar"
      inert={!visible}
      {...props}
    >
      <p aria-live="polite" className="flex min-w-0 flex-1 items-center gap-2 text-sm text-foreground" role="status">
        <span aria-hidden className="size-2 shrink-0 rounded-full bg-status-changes" />
        <span className="truncate">{t('unsavedChanges', { count })}</span>
      </p>
      <Button disabled={saving} onClick={onDiscard} type="button" variant="secondary">
        {t('discard')}
      </Button>
      <Button form={form} loading={saving} onClick={onSave} type={onSave ? 'button' : 'submit'} variant="primary">
        {t('saveChanges')}
      </Button>
    </div>
  )
}
