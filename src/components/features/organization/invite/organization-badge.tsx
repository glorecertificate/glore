import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export const OrganizationBadge = ({
  avatarUrl,
  className,
  name,
  ...props
}: React.ComponentProps<typeof Avatar> & { avatarUrl: string | null; name: string }) => (
  <Avatar className={cn('size-16 rounded-xl', className)} {...props}>
    {avatarUrl && <AvatarImage alt="" src={avatarUrl} />}
    <AvatarFallback className="rounded-xl text-lg">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
  </Avatar>
)
