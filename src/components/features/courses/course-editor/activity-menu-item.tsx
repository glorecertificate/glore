'use client'

import { LucideIcon } from '@/components/icons/lucide'
import { type IconName } from '@/components/icons/registry'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

interface ActivityMenuItemProps extends Omit<React.ComponentProps<typeof DropdownMenuItem>, 'title'> {
  hint: string
  icon: IconName
  title: string
}

export const ActivityMenuItem = ({ hint, icon, title, ...props }: ActivityMenuItemProps) => (
  <DropdownMenuItem className="items-start gap-3 py-2" {...props}>
    <LucideIcon className="mt-0.5 size-4" name={icon} />
    <span className="flex flex-col gap-0.5">
      <span className="font-medium">{title}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </span>
  </DropdownMenuItem>
)
