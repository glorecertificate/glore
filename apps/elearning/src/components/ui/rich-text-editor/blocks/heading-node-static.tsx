import { cva, type VariantProps } from 'class-variance-authority'
import { SlateElement, type SlateElementProps } from 'platejs'

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

export const HeadingElementStatic = ({
  variant = 'h1',
  ...props
}: SlateElementProps & VariantProps<typeof headingVariants>) => (
  <SlateElement as={variant!} className={headingVariants({ variant })} {...props}>
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
