import { SlateLeaf, type SlateLeafProps } from 'platejs'

export const CodeLeafStatic = (props: SlateLeafProps) => (
  <SlateLeaf
    {...props}
    as="code"
    className="rounded-md bg-muted px-[0.3em] py-[0.2em] font-mono text-sm whitespace-pre-wrap"
  >
    {props.children}
  </SlateLeaf>
)
