import { ChevronRightIcon } from 'lucide-react'
import { SlateElement, type SlateElementProps } from 'platejs/static'

export const ToggleElementStatic = (props: SlateElementProps) => (
  <SlateElement {...props} className="pl-6">
    <div
      className={
        'absolute top-0 -left-0.5 size-6 cursor-pointer select-none items-center justify-center rounded-md p-px text-muted-foreground transition-colors hover:bg-accent [&_svg]:size-4'
      }
      contentEditable={false}
    >
      <ChevronRightIcon className="rotate-0 transition-transform duration-75" />
    </div>
    {props.children}
  </SlateElement>
)
