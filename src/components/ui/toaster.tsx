'use client'

import { useMemo } from 'react'

import { Toaster as Sonner } from 'sonner'

import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'

export const Toaster = ({
  className,
  duration = 2500,
  hotkey = ['Escape'] as const,
  position = 'top-right',
  style,
  toastOptions,
  ...props
}: Omit<React.ComponentProps<typeof Sonner>, 'closeButton'>) => {
  const { theme } = useTheme()

  const toastStyle = useMemo(
    () =>
      ({
        '--normal-bg': 'var(--popover)',
        '--normal-border': 'var(--border)',
        '--normal-text': 'var(--popover-foreground)',
        ...style,
      }) as React.CSSProperties,
    [style]
  )

  const options = useMemo(
    () => ({
      ...toastOptions,
      classNames: {
        actionButton: 'bg-brand-secondary text-brand-secondary-foreground',
        cancelButton: 'bg-muted text-muted-foreground',
        closeButton: 'group-data-[type=info]/toast:border-blue-100! group-data-[type=info]/toast:hover:bg-blue-100/80!',
        description: 'text-muted-foreground text-base',
        icon: 'group-data-[type=info]/toast:text-info! mt-0.5 group-data-[type=success]/toast:text-success! group-data-[type=error]/toast:text-destructive!',
        title: 'font-normal!',
        toast: cn('group/toast w-max! items-start! bg-background text-foreground shadow-none!', className),
        ...toastOptions?.classNames,
      },
    }),
    [className, toastOptions]
  )

  return (
    <Sonner
      duration={duration}
      hotkey={hotkey}
      position={position}
      style={toastStyle}
      theme={theme}
      toastOptions={options}
      {...props}
    />
  )
}
