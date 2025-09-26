import {
  NodeApi,
  SlateElement,
  type SlateElementProps,
  type TCaptionProps,
  type TImageElement,
  type TResizableProps,
} from 'platejs'

import { cn } from '@repo/ui/utils'

export const ImageElementStatic = (props: SlateElementProps<TImageElement & TCaptionProps & TResizableProps>) => {
  const { align = 'center', caption, url, width } = props.element

  return (
    <SlateElement {...props} className="py-2.5">
      <figure className="group relative m-0 inline-block" style={{ width }}>
        <div className="relative max-w-full min-w-[92px]" style={{ textAlign: align }}>
          <img
            alt={props.attributes.alt as string}
            className={cn('w-full max-w-full cursor-default object-cover px-0', 'rounded-sm')}
            src={url}
          />
          {caption && (
            <figcaption className="mx-auto mt-2 h-[24px] max-w-full">{NodeApi.string(caption[0])}</figcaption>
          )}
        </div>
      </figure>
      {props.children}
    </SlateElement>
  )
}
