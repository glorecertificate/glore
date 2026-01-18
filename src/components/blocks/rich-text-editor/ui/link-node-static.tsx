import { getLinkAttributes } from '@platejs/link'
import { type TLinkElement } from 'platejs'
import { SlateElement, type SlateElementProps } from 'platejs/static'

export const LinkElementStatic = (props: SlateElementProps<TLinkElement>) => (
  <SlateElement
    {...props}
    as="a"
    attributes={{
      ...props.attributes,
      ...getLinkAttributes(props.editor, props.element),
    }}
    className="font-medium text-brand underline decoration-primary underline-offset-4"
  >
    {props.children}
  </SlateElement>
)
