'use client'

import { useCallback, useMemo, useState } from 'react'

import { EyeIcon, EyeOffIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input, type InputProps } from '@/components/ui/input'
import { useTranslations } from '@/hooks/use-translations'
import { cn } from '@/lib/utils'

export const PasswordInput = ({ className, disabled, value, ...props }: InputProps) => {
  const t = useTranslations('Common')
  const [showPassword, setShowPassword] = useState(false)

  const inputType = useMemo(() => (showPassword ? 'text' : 'password'), [showPassword])
  const srText = useMemo(() => `${showPassword ? t('hide') : t('show')} password`, [showPassword, t])

  const togglePassword = useCallback(() => {
    setShowPassword(!showPassword)
  }, [showPassword])

  return (
    <div className="relative">
      <Input className={cn('pr-10', className)} type={inputType} {...props} />
      <Button
        className="absolute top-0 right-0 h-full py-2 hover:bg-transparent has-[>svg]:px-3"
        disabled={disabled}
        onClick={togglePassword}
        size="sm"
        type="button"
        variant="ghost"
      >
        {showPassword && !disabled ? (
          <EyeIcon aria-hidden="true" className="size-4.5 fill-brand/10 stroke-muted-foreground" />
        ) : (
          <EyeOffIcon aria-hidden="true" className="size-4.5 fill-brand/10 stroke-muted-foreground" />
        )}
        <span className="sr-only">{srText}</span>
      </Button>
    </div>
  )
}
