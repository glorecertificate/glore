'use client'

import * as LabelPrimitive from '@radix-ui/react-label'

import { cn } from '@repo/ui/utils'

export interface LabelProps extends React.ComponentProps<typeof LabelPrimitive.Root> {}

export const Label = ({ className, ...props }: LabelProps) => (
  <LabelPrimitive.Root
    className={cn('text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed', className)}
    data-slot="label"
    {...props}
  />
)
