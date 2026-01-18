'use client'

import * as LabelPrimitive from '@radix-ui/react-label'

import { cn } from '@/lib/utils'

export const Label = ({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) => (
  <LabelPrimitive.Root
    className={cn('select-none font-medium text-sm leading-none peer-disabled:cursor-not-allowed', className)}
    data-slot="label"
    {...props}
  />
)
