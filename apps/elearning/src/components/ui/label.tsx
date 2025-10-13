'use client'

import { Label as LabelPrimitive } from '@radix-ui/react-label'

import { cn } from '@/lib/utils'

export interface LabelProps extends React.ComponentProps<typeof LabelPrimitive> {}

export const Label = ({ className, ...props }: LabelProps) => (
  <LabelPrimitive
    className={cn('select-none font-medium text-sm leading-none peer-disabled:cursor-not-allowed', className)}
    data-slot="label"
    {...props}
  />
)
