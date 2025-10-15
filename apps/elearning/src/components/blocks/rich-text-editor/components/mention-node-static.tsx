import { KEYS, SlateElement, type SlateElementProps, type TMentionElement } from 'platejs'

import { cn } from '@/lib/utils'

export const MentionElementStatic = (
  props: SlateElementProps<TMentionElement> & {
    prefix?: string
  }
) => {
  const { prefix } = props
  const element = props.element

  return (
    <SlateElement
      {...props}
      attributes={{
        ...props.attributes,
        'data-slate-value': element.value,
      }}
      className={cn(
        'inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline font-medium text-sm',
        element.children[0][KEYS.bold] === true && 'font-bold',
        element.children[0][KEYS.italic] === true && 'italic',
        element.children[0][KEYS.underline] === true && 'underline'
      )}
    >
      {props.children}
      {prefix}
      {element.value}
    </SlateElement>
  )
}
