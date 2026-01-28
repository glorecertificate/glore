import { DynamicIcon } from 'lucide-react/dynamic'

import { type IconName, type IconProps } from '@/lib/types'
import { cn } from '@/lib/utils'

export const LucideIcon = ({
  className,
  fallback,
  ...props
}: IconProps<{
  name: IconName
  fallback?: React.ReactNode
}>) => (
  <>
    <DynamicIcon className={cn('peer', className)} {...props} />
    {fallback && <span className="peer-has-[*]:hidden">{fallback}</span>}
  </>
)
