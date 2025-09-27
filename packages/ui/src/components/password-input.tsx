'use client'

import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { Button } from '@repo/ui/components/button'
import { Input, type InputProps } from '@repo/ui/components/input'
import { cn } from '@repo/ui/utils'

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
        className="absolute top-0 right-0 h-full py-2 has-[>svg]:px-3"
        disabled={disabled}
        onClick={togglePassword}
        size="sm"
        type="button"
        variant="transparent"
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
