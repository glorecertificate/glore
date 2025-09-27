import { SlateLeaf, type SlateLeafProps } from 'platejs'

export const HighlightLeafStatic = (props: SlateLeafProps) => (
  <SlateLeaf {...props} as="mark" className="bg-editor-highlight/30 text-inherit">
    {props.children}
  </SlateLeaf>
)
