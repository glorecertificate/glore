'use client'

import { useCallback, useState } from 'react'

import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Input, type InputProps } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  hideLabel?: string
  showLabel?: string
}

export const PasswordInput = ({
  className,
  disabled,
  hideLabel,
  placeholder,
  showLabel,
  ...props
}: PasswordInputProps) => {
  const t = useTranslations('Components.PasswordInput')

  const [passwordVisible, setPasswordVisible] = useState(false)

  const inputType = passwordVisible ? 'text' : 'password'
  const inputPlaceholder = placeholder ?? t('label')
  const textShow = showLabel ?? t('show')
  const textHide = hideLabel ?? t('hide')
  const textToggle = passwordVisible ? textHide : textShow

  const togglePassword = useCallback(() => {
    setPasswordVisible(prev => !prev)
  }, [])

  return (
    <div className="relative">
      <Input
        className={cn('pr-10', className)}
        disabled={disabled}
        placeholder={inputPlaceholder}
        type={inputType}
        {...props}
      />
      <Button
        className="-translate-y-1/2 absolute top-1/2 right-1.5 size-6 rounded-full p-0 has-[>svg]:px-3"
        disabled={disabled}
        onClick={togglePassword}
        size="sm"
        title={textToggle}
        type="button"
        variant="ghost"
      >
        {passwordVisible && !disabled ? (
          <EyeIcon aria-hidden="true" className="size-4.5 stroke-foreground/80" />
        ) : (
          <EyeOffIcon aria-hidden="true" className="size-4.5 stroke-muted-foreground" />
        )}
        <span className="sr-only">{textToggle}</span>
      </Button>
    </div>
  )
}
