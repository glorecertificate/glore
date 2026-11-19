'use client'

import { DeleteButton } from '@/components/features/courses/course-editor/delete-button'
import { cn } from '@/lib/utils'

interface ActivityCardProps extends Omit<React.ComponentProps<'div'>, 'children' | 'id'> {
  children: React.ReactNode
  deleteLabel: string
  label: string
  onRemove: () => void
}

export const ActivityCard = ({ children, className, deleteLabel, label, onRemove, ...props }: ActivityCardProps) => (
  <div className={cn('space-y-3 rounded-xl border bg-card p-4', className)} {...props}>
    <div className="flex min-h-7 items-center justify-between gap-2">
      <p className="type-label text-foreground">{label}</p>
      <DeleteButton className="-mr-1.5" label={deleteLabel} onClick={onRemove} />
    </div>
    {children}
  </div>
)
