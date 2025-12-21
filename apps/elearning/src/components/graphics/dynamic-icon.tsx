import type { LucideProps } from 'lucide-react'
import { type IconName, DynamicIcon as LucideDynamic } from 'lucide-react/dynamic'

import { cn } from '@/lib/utils'

export const DynamicIcon = ({
  children,
  className,
  ...props
}: LucideProps & {
  name: IconName
}) => (
  <>
    <LucideDynamic className={cn('peer', className)} {...props} />
    {children && <span className="peer-has-[*]:hidden">{children}</span>}
  </>
)
