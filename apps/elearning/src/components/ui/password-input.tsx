'use client'

import { useCallback, useMemo, useState } from 'react'

import { EyeIcon, EyeOffIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input, type InputProps } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export const PasswordInput = ({
  className,
  disabled,
  srHide = 'Hide password',
  srShow = 'Show password',
  ...props
}: InputProps & {
  srHide?: string
  srShow?: string
}) => {
  const [showPassword, setShowPassword] = useState(false)

  const inputType = useMemo(() => (showPassword ? 'text' : 'password'), [showPassword])
  const srText = useMemo(() => (showPassword ? srHide : srShow), [showPassword, srHide, srShow])

  const togglePassword = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  return (
    <div className="relative">
      <Input className={cn('pr-10', className)} disabled={disabled} type={inputType} {...props} />
      <Button
        className="-translate-y-1/2 absolute top-1/2 right-1.5 size-6 rounded-full p-0 has-[>svg]:px-3"
        disabled={disabled}
        onClick={togglePassword}
        size="sm"
        type="button"
        variant="ghost"
      >
        {showPassword && !disabled ? (
          <EyeIcon aria-hidden="true" className="size-4.5 stroke-foreground/80" />
        ) : (
          <EyeOffIcon aria-hidden="true" className="size-4.5 stroke-muted-foreground" />
        )}
        <span className="sr-only">{srText}</span>
      </Button>
    </div>
  )
}
