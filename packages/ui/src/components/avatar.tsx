'use client'

import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { HoverCardContent } from '@radix-ui/react-hover-card'

import { HoverCard, HoverCardTrigger } from '@repo/ui/components/hover-card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui/components/tooltip'
import { cn } from '@repo/ui/utils'

export interface AvatarProps extends React.ComponentProps<typeof AvatarPrimitive.Root> {}

export const Avatar = ({ className, ...props }: AvatarProps) => (
  <AvatarPrimitive.Root
    className={cn('relative flex size-8 shrink-0 overflow-hidden', className)}
    data-slot="avatar"
    {...props}
  />
)

export interface AvatarImageProps extends React.ComponentProps<typeof AvatarPrimitive.Image> {}

export const AvatarImage = ({ className, ...props }: AvatarImageProps) => (
  <AvatarPrimitive.Image className={cn('aspect-square size-full', className)} data-slot="avatar-image" {...props} />
)

export interface AvatarFallbackProps extends React.ComponentProps<typeof AvatarPrimitive.Fallback> {}

export const AvatarFallback = ({ className, ...props }: AvatarFallbackProps) => (
  <AvatarPrimitive.Fallback
    className={cn('flex size-full items-center justify-center bg-muted', className)}
    data-slot="avatar-fallback"
    {...props}
  />
)

const avatars = [
  {
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-3.png',
    fallback: 'OS',
    name: 'Olivia Sparks',
  },
  {
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-6.png',
    fallback: 'HL',
    name: 'Howard Lloyd',
  },
  {
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png',
    fallback: 'HR',
    name: 'Hallie Richards',
  },
  {
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-16.png',
    fallback: 'JW',
    name: 'Jenny Wilson',
  },
]

export const AvatarGroupTooltipDemo = () => (
  <div className="flex -space-x-2">
    {avatars.map((avatar, index) => (
      <Tooltip key={index}>
        <TooltipTrigger asChild>
          <Avatar className="ring-2 ring-background transition-all duration-300 ease-in-out hover:z-1 hover:-translate-y-1 hover:shadow-md">
            <AvatarImage alt={avatar.name} src={avatar.src} />
            <AvatarFallback className="text-xs">{avatar.fallback}</AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent>{avatar.name}</TooltipContent>
      </Tooltip>
    ))}
  </div>
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
    <div className={cn('flex -space-x-0.5 hover:space-x-1', className)} {...props}>
      {avatars.map((avatar, i) => (
        <HoverCard closeDelay={50} key={i} openDelay={300}>
          <HoverCardTrigger asChild>
            <Avatar
              className={cn(
                'size-3.5 rounded-full ring-2 ring-background transition-all duration-200 ease-in-out',
                avatarClassName,
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
