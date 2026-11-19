'use client'

import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface DeleteButtonProps extends Omit<React.ComponentProps<typeof Button>, 'aria-label' | 'children'> {
  label: string
}

export const DeleteButton = ({ className, label, ...props }: DeleteButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        aria-label={label}
        className={cn('shrink-0 text-muted-foreground hover:text-destructive-text', className)}
        size="icon-xs"
        type="button"
        variant="ghost"
        {...props}
      >
        <LucideIcon name="trash" />
      </Button>
    </TooltipTrigger>
    <TooltipContent size="sm">{label}</TooltipContent>
  </Tooltip>
)
