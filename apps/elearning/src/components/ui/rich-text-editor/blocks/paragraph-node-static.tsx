import { SlateElement, type SlateElementProps } from 'platejs'

import { cn } from '@/lib/utils'

export const ParagraphElementStatic = (props: SlateElementProps) => (
  <SlateElement {...props} className={cn('m-0 px-0 py-1')}>
    {props.children}
  </SlateElement>
)
