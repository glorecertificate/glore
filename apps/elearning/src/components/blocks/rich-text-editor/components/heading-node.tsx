'use client'

import { type VariantProps, cva } from 'class-variance-authority'
import { PlateElement, type PlateElementProps } from 'platejs/react'

const headingVariants = cva('relative mb-1', {
  variants: {
    variant: {
      h1: 'mt-4 pb-1 font-bold font-heading text-4xl',
      h2: 'mt-3 pb-px font-heading font-semibold text-2xl tracking-tight',
      h3: 'mt-2 pb-px font-heading font-semibold text-xl tracking-tight',
      h4: 'mt-1 font-heading font-semibold text-lg tracking-tight',
      h5: 'mt-0.5 font-semibold text-lg tracking-tight',
      h6: 'font-semibold text-base tracking-tight',
    },
  },
})

export const HeadingElement = ({
  variant = 'h1',
  ...props
}: PlateElementProps & VariantProps<typeof headingVariants>) => (
  <PlateElement as={variant as keyof HTMLElementTagNameMap} className={headingVariants({ variant })} {...props}>
    {props.children}
  </PlateElement>
)

export const H1Element = (props: PlateElementProps) => <HeadingElement variant="h1" {...props} />

export const H2Element = (props: PlateElementProps) => <HeadingElement variant="h2" {...props} />

export const H3Element = (props: PlateElementProps) => <HeadingElement variant="h3" {...props} />

export const H4Element = (props: PlateElementProps) => <HeadingElement variant="h4" {...props} />

export const H5Element = (props: PlateElementProps) => <HeadingElement variant="h5" {...props} />

export const H6Element = (props: PlateElementProps) => <HeadingElement variant="h6" {...props} />
