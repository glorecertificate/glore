import { type VariantProps, cva } from 'class-variance-authority'
import { SlateElement, type SlateElementProps } from 'platejs'

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

export const HeadingElementStatic = ({
  variant = 'h1',
  ...props
}: SlateElementProps & VariantProps<typeof headingVariants>) => (
  <SlateElement as={variant as keyof HTMLElementTagNameMap} className={headingVariants({ variant })} {...props}>
    {props.children}
  </SlateElement>
)

export const H1ElementStatic = (props: SlateElementProps) => <HeadingElementStatic variant="h1" {...props} />

export const H2ElementStatic = (props: React.ComponentProps<typeof HeadingElementStatic>) => (
  <HeadingElementStatic variant="h2" {...props} />
)

export const H3ElementStatic = (props: React.ComponentProps<typeof HeadingElementStatic>) => (
  <HeadingElementStatic variant="h3" {...props} />
)

export const H4ElementStatic = (props: React.ComponentProps<typeof HeadingElementStatic>) => (
  <HeadingElementStatic variant="h4" {...props} />
)

export const H5ElementStatic = (props: React.ComponentProps<typeof HeadingElementStatic>) => (
  <HeadingElementStatic variant="h5" {...props} />
)

export const H6ElementStatic = (props: React.ComponentProps<typeof HeadingElementStatic>) => (
  <HeadingElementStatic variant="h6" {...props} />
)
