import { DynamicIcon as LucideDynamic, type IconName as LucideIcon } from 'lucide-react/dynamic'

import { type IconProps } from '@/components/icons/types'
import { cn } from '@/lib/utils'

export type IconName = LucideIcon

export type DynamicIconProps = IconProps<{
  name: IconName
}>

export const DynamicIcon = ({ children, className, ...props }: DynamicIconProps) => (
  <>
    <LucideDynamic className={cn('peer', className)} {...props} />
    {children && <span className="peer-has-[*]:hidden">{children}</span>}
  </>
)
