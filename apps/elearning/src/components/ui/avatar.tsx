'use client'

import { Fallback, Image, Root } from '@radix-ui/react-avatar'
import { HoverCardContent } from '@radix-ui/react-hover-card'

import { HoverCard, HoverCardTrigger } from '@/components/ui/hover-card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
  <div className="-space-x-2 flex">
    {avatars.map((avatar, index) => (
      <Tooltip key={index}>
        <TooltipTrigger asChild>
          <Avatar className="hover:-translate-y-1 ring-2 ring-background transition-all duration-300 ease-in-out hover:z-1 hover:shadow-md">
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
