'use client'

import React, { useId } from 'react'

import { useTranslations } from 'next-intl'

import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

export const PublishSwitch = ({
  className,
  disabled,
  onToggle,
  published,
  ...props
}: React.ComponentProps<'label'> & {
  disabled?: boolean
  onToggle: () => void
  published: boolean
}) => {
  const id = useId()
  const t = useTranslations('Courses')
  const label = published ? t('publishSwitchPublished') : t('publishSwitchDraft')

  return (
    <label
      className={cn(
        'flex min-w-58 items-center gap-2.5 px-2 py-1 text-left',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className
      )}
      htmlFor={id}
      {...props}
    >
      <Switch
        aria-label={label}
        checked={published}
        className="h-6 w-10.5 data-[state=checked]:bg-success data-[state=unchecked]:bg-muted-foreground/30"
        disabled={disabled}
        id={id}
        onCheckedChange={onToggle}
      />
      {/* <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 motion-reduce:transition-none',
          published ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
        )}
      >
        <svg
          fill="none"
          height={22}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
          width={22}
        >
          <circle cx={12} cy={12} r={9} />
          {published ? <path d="M8.5 12.5l2.5 2.5 4.5-5" /> : <path d="M12 8v4 M12 16h.01" />}
        </svg>
      </span> */}
      <span className="flex flex-1 flex-col gap-0.5 leading-[normal]">
        <span className="text-[13.5px] font-semibold text-foreground">{label}</span>
        <span className="text-[11.5px] text-muted-foreground">
          {published ? t('publishSwitchVisible', { count: 1 }) : t('publishSwitchHidden')}
        </span>
      </span>
    </label>
  )
}
