'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { PlateElement, type PlateElementProps } from 'platejs/react'

const headingVariants = cva('relative mb-1', {
  variants: {
    variant: {
      h1: 'font-heading mt-4 pb-1 text-4xl font-bold',
      h2: 'font-heading mt-3 pb-px text-2xl font-semibold tracking-tight',
      h3: 'font-heading mt-2 pb-px text-xl font-semibold tracking-tight',
      h4: 'font-heading mt-1 text-lg font-semibold tracking-tight',
      h5: 'mt-0.5 text-lg font-semibold tracking-tight',
      h6: 'text-base font-semibold tracking-tight',
    },
  },
})

export const HeadingElement = ({
  variant = 'h1',
  ...props
}: PlateElementProps & VariantProps<typeof headingVariants>) => (
  <PlateElement as={variant!} className={headingVariants({ variant })} {...props}>
    {props.children}
  </PlateElement>
)

export const H1Element = (props: PlateElementProps) => <HeadingElement variant="h1" {...props} />

export const H2Element = (props: PlateElementProps) => <HeadingElement variant="h2" {...props} />

export const H3Element = (props: PlateElementProps) => <HeadingElement variant="h3" {...props} />

export const H4Element = (props: PlateElementProps) => <HeadingElement variant="h4" {...props} />

export const H5Element = (props: PlateElementProps) => <HeadingElement variant="h5" {...props} />

export const H6Element = (props: PlateElementProps) => <HeadingElement variant="h6" {...props} />
