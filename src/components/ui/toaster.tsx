'use client'

import { Toaster as Sonner } from 'sonner'

import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'

const DEFAULT_HOTKEY = ['Escape']
const DEFAULT_OFFSET = { top: 'calc(5rem + env(safe-area-inset-top))' }

export const Toaster = ({
  className,
  duration = 2500,
  hotkey = DEFAULT_HOTKEY,
  mobileOffset = DEFAULT_OFFSET,
  offset = DEFAULT_OFFSET,
  position = 'bottom-right',
  style,
  toastOptions,
  ...props
}: React.ComponentProps<typeof Sonner>) => {
  const { theme } = useTheme()

  return (
    <Sonner
      duration={duration}
      hotkey={hotkey}
      mobileOffset={mobileOffset}
      offset={offset}
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
          actionButton: 'bg-primary! text-primary-foreground!',
          cancelButton: 'bg-muted text-muted-foreground',
          closeButton: 'group-data-[type=info]/toast:border-info/20! group-data-[type=info]/toast:hover:bg-info/10!',
          description: 'text-sm text-muted-foreground',
          icon: 'group-data-[type=info]/toast:text-info-text! mt-0.5 group-data-[type=success]/toast:text-success-text! group-data-[type=error]/toast:text-destructive-text!',
          title: 'text-sm font-medium!',
          toast: cn('group/toast w-max! items-start! bg-background text-foreground shadow-md!', className),
          ...toastOptions?.classNames,
        },
      }}
      {...props}
    />
  )
}
