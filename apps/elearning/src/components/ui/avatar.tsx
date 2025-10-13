'use client'

import { Fallback, Image, Root } from '@radix-ui/react-avatar'
import { HoverCardContent } from '@radix-ui/react-hover-card'

import { HoverCard, HoverCardTrigger } from '@/components/ui/hover-card'
import { cn } from '@/lib/utils'

export interface AvatarProps extends React.ComponentProps<typeof Root> {}

export const Avatar = ({ className, ...props }: AvatarProps) => (
  <Root className={cn('relative flex size-8 shrink-0 overflow-hidden', className)} data-slot="avatar" {...props} />
)

export interface AvatarImageProps extends React.ComponentProps<typeof Image> {}

export const AvatarImage = ({ className, ...props }: AvatarImageProps) => (
  <Image className={cn('aspect-square size-full', className)} data-slot="avatar-image" {...props} />
)

export interface AvatarFallbackProps extends React.ComponentProps<typeof Fallback> {}

export const AvatarFallback = ({ className, ...props }: AvatarFallbackProps) => (
  <Fallback
    className={cn('pointer-events-none flex size-full items-center justify-center bg-muted', className)}
    data-slot="avatar-fallback"
    {...props}
  />
)

export interface AvatarStackProps<
  T extends {
    url?: string
    placeholder?: string
  },
> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'content'> {
  avatarProps?: AvatarProps
  avatars: T[]
  content?: (props: T) => React.ReactNode
}

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
}: AvatarStackProps<T>) => {
  const { className: avatarClassName, ...avatarProps } = props.avatarProps ?? {}

  return (
    <div className={cn('-space-x-0.5 flex hover:space-x-1', className)} {...props}>
      {avatars.map((avatar, i) => (
        <HoverCard closeDelay={50} key={i} openDelay={300}>
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
