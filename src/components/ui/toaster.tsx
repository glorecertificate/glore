'use client'

import { Toaster as Sonner } from 'sonner'

import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'

const DEFAULT_HOTKEY = ['Escape']

export const Toaster = ({
  className,
  duration = 2500,
  hotkey = DEFAULT_HOTKEY,
  position = 'top-center',
  style,
  toastOptions,
  ...props
}: React.ComponentProps<typeof Sonner>) => {
  const { theme } = useTheme()

  return (
    <Sonner
      duration={duration}
      hotkey={hotkey}
      position={position}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-border': 'var(--border)',
          '--normal-text': 'var(--popover-foreground)',
          ...style,
        } as React.CSSProperties
      }
      theme={theme}
      toastOptions={{
        ...toastOptions,
        classNames: {
          actionButton: 'bg-brand-secondary text-brand-secondary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
          closeButton:
            'group-data-[type=info]/toast:border-blue-100! group-data-[type=info]/toast:hover:bg-blue-100/80!',
          description: 'text-muted-foreground text-base',
          icon: 'group-data-[type=info]/toast:text-info! mt-0.5 group-data-[type=success]/toast:text-success! group-data-[type=error]/toast:text-destructive!',
          title: 'font-normal!',
          toast: cn('group/toast w-max! items-start! bg-background text-foreground shadow-none!', className),
          ...toastOptions?.classNames,
        },
      }}
      {...props}
    />
  )
}
