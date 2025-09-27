import { SlateElement, type SlateElementProps } from 'platejs'

import { cn } from '@repo/ui/utils'

export const HrElementStatic = (props: SlateElementProps) => (
  <SlateElement {...props}>
    <div className="cursor-text py-6" contentEditable={false}>
      <hr className={cn('h-0.5 rounded-sm border-none bg-muted bg-clip-content')} />
    </div>
    {props.children}
  </SlateElement>
)
