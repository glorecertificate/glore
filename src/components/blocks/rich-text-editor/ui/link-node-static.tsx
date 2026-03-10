import { getLinkAttributes } from '@platejs/link'
import { type TLinkElement } from 'platejs'
import { SlateElement, type SlateElementProps } from 'platejs/static'

export const LinkElementStatic = (props: SlateElementProps<TLinkElement>) => {
  // oxlint-disable-next-line
  const linkAttributes = {
    ...props.attributes,
    ...getLinkAttributes(props.editor, props.element),
  }

  return (
    <SlateElement
      {...props}
      as="a"
      attributes={linkAttributes}
      className="font-medium text-brand underline decoration-primary underline-offset-4"
    >
      {props.children}
    </SlateElement>
  )
}
