'use client'

import * as AvatarPrimitive from '@radix-ui/react-avatar'

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { cn } from '@/lib/utils'

interface AvatarProps extends React.ComponentProps<typeof AvatarPrimitive.Root> {}

export const Avatar = ({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) => (
  <AvatarPrimitive.Root
    className={cn('relative flex size-8 shrink-0 overflow-hidden', className)}
    data-slot="avatar"
    {...props}
  />
)

export const AvatarImage = ({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) => (
  <AvatarPrimitive.Image
    className={cn('aspect-square size-full overflow-hidden', className)}
    data-slot="avatar-image"
    {...props}
  />
)

export const AvatarFallback = ({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) => (
  <AvatarPrimitive.Fallback
    className={cn('pointer-events-none flex size-full items-center justify-center overflow-hidden bg-muted', className)}
    data-slot="avatar-fallback"
    {...props}
  />
)

export const AvatarStack = <
  T extends {
    url?: string
    placeholder?: string
  },
>({
  avatars,
  className,
  content,
  ...props
}: Omit<React.HTMLAttributes<HTMLDivElement>, 'content'> & {
  avatarProps?: AvatarProps
  avatars: T[]
  content?: (props: T) => React.ReactNode
}) => {
  const { className: avatarClassName, ...avatarProps } = props.avatarProps ?? {}

  return (
    <div className={cn('flex -space-x-0.5 hover:space-x-1', className)} {...props}>
      {avatars.map(avatar => (
        <HoverCard closeDelay={50} key={avatar.url} openDelay={300}>
          <HoverCardTrigger asChild>
            <Avatar
              className={cn(
                'size-3.5 rounded-full ring-2 ring-background transition-all duration-200 ease-in-out',
                avatarClassName
              )}
              {...avatarProps}
            >
              {avatar.url && <AvatarImage className="rounded-full" src={avatar.url} />}
              {avatar.placeholder && <AvatarFallback className="text-xs">{avatar.placeholder}</AvatarFallback>}
            </Avatar>
          </HoverCardTrigger>
          <HoverCardContent className="bg-popover" side="top">
            {content ? content(avatar) : null}
          </HoverCardContent>
        </HoverCard>
      ))}
    </div>
  )
}
