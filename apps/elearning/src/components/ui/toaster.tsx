'use client'

import { Toaster as Sonner, type ToasterProps } from 'sonner'

import { useTheme } from '@/hooks/use-theme'
import { Theme } from '@/lib/theme'
import { cn, tw } from '@/lib/utils'

export const Toaster = ({ className, position = 'bottom-center', richColors = true, ...props }: ToasterProps) => {
  const { theme = Theme.System } = useTheme()

  return (
    <Sonner
      className={cn('toaster group', className)}
      duration={100_000}
      position={position}
      richColors={richColors}
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
          toast: tw`group toast !w-max group-[.toaster]:border-border group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:shadow-lg`,
          title: tw`!font-normal`,
          description: tw`group-[.toast]:text-muted-foreground`,
          actionButton: tw`group-[.toast]:bg-primary group-[.toast]:text-primary-foreground`,
          cancelButton: tw`group-[.toast]:bg-muted group-[.toast]:text-muted-foreground`,
        },
      }}
      {...props}
    />
  )
}
