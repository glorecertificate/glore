'use client'

import { Toaster as Sonner, type ToasterProps as SonnerProps } from 'sonner'

import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'

export interface ToasterProps extends Omit<SonnerProps, 'closeButton'> {
  closeButton?: boolean | 'hover'
}

export const Toaster = ({
  className,
  closeButton = false,
  duration = 2000,
  hotkey = ['Escape'],
  position = 'top-right',
  ...props
}: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      closeButton={!!closeButton}
      duration={duration}
      hotkey={hotkey}
      position={position}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      theme={theme}
      toastOptions={{
        classNames: {
          toast: cn('group/toast w-max! bg-background text-foreground shadow-none!', className),
          icon: 'group-data-[type=info]/toast:text-info! group-data-[type=success]/toast:text-success! group-data-[type=error]/toast:text-destructive!',
          title: 'font-normal!',
          description: 'text-muted-foreground text-base',
          actionButton: 'bg-brand-secondary text-brand-secondary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
          closeButton: cn(
            'group-data-[type=info]/toast:border-blue-100! group-data-[type=info]/toast:hover:bg-blue-100/80!',
            closeButton === 'hover' && 'opacity-0 group-hover:opacity-100'
          ),
        },
      }}
      {...props}
    />
  )
}
