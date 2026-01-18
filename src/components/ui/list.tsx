import { useMemo } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

export const List = ({
  className,
  variant,
  ...props
}: React.ComponentProps<'ul'> & VariantProps<typeof listVariants>) => {
  const styles = useMemo(() => listVariants({ className, variant }), [className, variant])
  return <ul className={styles} data-slot="list" {...props} />
}

export const ListItem = (props: React.ComponentProps<'li'>) => <li data-slot="list-item" {...props} />

const listVariants = cva('list-inside list-disc space-y-1', {
  defaultVariants: {
    variant: 'default',
  },
  variants: {
    variant: {
      default: '',
      list: 'list-inside list-disc space-y-1 [&>li]:pl-4',
      'outside-list': 'list-outside list-disc space-y-1',
    },
  },
})
