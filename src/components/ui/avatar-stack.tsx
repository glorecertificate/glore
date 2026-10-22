'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { cn } from '@/lib/utils'

export const AvatarStack = <T extends { id: string; placeholder: string; url?: string | null }>({
  avatarProps,
  avatars,
  className,
  content,
  ...props
}: Omit<React.ComponentProps<'div'>, 'content'> & {
  avatarProps?: React.ComponentProps<typeof Avatar>
  avatars: T[]
  content?: (avatar: T) => React.ReactNode
}) => (
  <div className={cn('flex items-center [&>*+*]:-ml-2', className)} data-slot="avatar-stack" {...props}>
    {avatars.map(avatar => {
      const image = (
        <Avatar {...avatarProps} className={cn('size-8 rounded-full ring-2 ring-background', avatarProps?.className)}>
          {avatar.url && <AvatarImage alt="" src={avatar.url} />}
          <AvatarFallback className="rounded-full text-xs">
            {avatar.placeholder.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )

      if (!content) {
        return (
          <span aria-label={avatar.placeholder} key={avatar.id} role="img">
            {image}
          </span>
        )
      }

      return (
        <HoverCard key={avatar.id}>
          <HoverCardTrigger asChild>
            <button
              aria-label={avatar.placeholder}
              className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
              type="button"
            >
              {image}
            </button>
          </HoverCardTrigger>
          <HoverCardContent side="top">{content(avatar)}</HoverCardContent>
        </HoverCard>
      )
    })}
  </div>
)
