'use client'

import * as AvatarPrimitive from '@radix-ui/react-avatar'

import { cn } from '@/lib/utils'

export const Avatar = ({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) => (
  <AvatarPrimitive.Root
    className={cn('relative flex size-8 shrink-0 overflow-hidden', className)}
    data-slot="avatar"
    {...props}
  />
)

export const AvatarImage = ({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) => (
  <AvatarPrimitive.Image
    alt=""
    className={cn('aspect-square size-full overflow-hidden', className)}
    data-slot="avatar-image"
    {...props}
  />
)

export const AvatarFallback = ({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) => (
  <AvatarPrimitive.Fallback
    className={cn(
      'pointer-events-none flex size-full items-center justify-center overflow-hidden bg-brand/12 font-medium text-brand-text',
      className
    )}
    data-slot="avatar-fallback"
    {...props}
  />
)
