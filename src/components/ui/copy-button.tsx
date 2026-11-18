'use client'

import { useEffect, useRef, useState } from 'react'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export const CopyButton = ({
  copiedLabel,
  disabled,
  iconOnly = false,
  label,
  size,
  value,
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'asChild' | 'children' | 'icon' | 'loading' | 'onClick'> & {
  copiedLabel?: string
  iconOnly?: boolean
  label?: string
  value: string
}) => {
  const t = useTranslations('Components.CopyButton')
  const [status, setStatus] = useState({ copied: false, pending: false, value })
  if (status.value !== value) setStatus({ copied: false, pending: false, value })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted = useRef(false)
  const request = useRef(0)

  useEffect(() => {
    mounted.current = true
    request.current += 1
    return () => {
      mounted.current = false
      request.current += 1
      if (timer.current) clearTimeout(timer.current)
    }
  }, [value])

  const copied = status.value === value && status.copied
  const pending = status.value === value && status.pending

  const copy = async () => {
    if (pending) return
    const operation = ++request.current
    setStatus({ copied: false, pending: true, value })
    try {
      await navigator.clipboard.writeText(value)
      if (!mounted.current || operation !== request.current) return
      setStatus({ copied: true, pending: false, value })
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setStatus({ copied: false, pending: false, value }), 2000)
    } catch {
      if (mounted.current && operation === request.current) toast.error(t('error'))
    } finally {
      if (mounted.current && operation === request.current) setStatus(current => ({ ...current, pending: false }))
    }
  }

  const text = copied ? (copiedLabel ?? t('copied')) : (label ?? t('copy'))

  if (iconOnly) {
    return (
      <>
        <Tooltip>
          <TooltipTrigger asChild pointerEvents="auto">
            <Button
              aria-label={label ?? t('copy')}
              disabled={disabled || pending}
              onClick={() => void copy()}
              size={size ?? 'icon-sm'}
              type="button"
              variant="ghost"
              {...props}
            >
              <LucideIcon name={copied ? 'check' : 'copy'} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{text}</TooltipContent>
        </Tooltip>
        <span aria-live="polite" className="sr-only">
          {copied ? text : ''}
        </span>
      </>
    )
  }

  return (
    <Button
      disabled={disabled || pending}
      onClick={() => void copy()}
      size={size}
      type="button"
      variant="outline"
      {...props}
    >
      <LucideIcon name={copied ? 'check' : 'copy'} />
      <span aria-live="polite">{text}</span>
    </Button>
  )
}
