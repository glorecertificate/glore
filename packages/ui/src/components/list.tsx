import { cva, type VariantProps } from 'class-variance-authority'
import { useMemo } from 'react'

export interface ListProps extends React.ComponentProps<'ul'>, VariantProps<typeof list> {}

const ListItem = (props: React.ComponentProps<'li'>) => <li data-slot="list-item" {...props} />

export const List = ({ className, variant, ...props }: ListProps) => {
  const styles = useMemo(() => list({ className, variant }), [className, variant])
  return <ul className={styles} data-slot="list" {...props} />
}
List.Item = ListItem

export const list = cva('list-inside list-disc space-y-1', {
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
