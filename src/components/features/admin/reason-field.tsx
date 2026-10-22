'use client'

import { useTranslations } from 'next-intl'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MAX_ADMIN_REASON_LENGTH, MIN_ADMIN_REASON_LENGTH } from '@/db/queries/admin-user'

export const ReasonField = ({
  disabled,
  id,
  onChange,
  placeholder,
  value,
}: {
  disabled?: boolean
  id: string
  onChange: (value: string) => void
  placeholder: string
  value: string
}) => {
  const t = useTranslations('Admin.users')

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{t('reasonLabel')}</Label>
      <Textarea
        disabled={disabled}
        id={id}
        maxLength={MAX_ADMIN_REASON_LENGTH}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        value={value}
      />
      <p className="text-xs text-muted-foreground">
        {t('reasonHint', { max: MAX_ADMIN_REASON_LENGTH, min: MIN_ADMIN_REASON_LENGTH })}
      </p>
    </div>
  )
}
