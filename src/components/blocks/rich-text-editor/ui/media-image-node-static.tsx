import { useMemo } from 'react'

import { NodeApi, type TCaptionProps, type TImageElement, type TResizableProps } from 'platejs'
import { SlateElement, type SlateElementProps } from 'platejs/static'

import { cn } from '@/lib/utils'

export const ImageElementStatic = (props: SlateElementProps<TImageElement & TCaptionProps & TResizableProps>) => {
  const { align = 'center', caption, url, width } = props.element
  const figureStyle = useMemo(() => ({ width }), [width])
  const divStyle = useMemo(() => ({ textAlign: align as React.CSSProperties['textAlign'] }), [align])

  return (
    <SlateElement {...props} className="py-2.5">
      <figure className="group relative m-0 inline-block" style={figureStyle}>
        <div className="relative max-w-full min-w-23" style={divStyle}>
          <img
            alt={props.attributes.alt as string}
            className={cn('w-full max-w-full cursor-default object-cover px-0', 'rounded-sm')}
            src={url}
          />
          {caption && <figcaption className="mx-auto mt-2 h-6 max-w-full">{NodeApi.string(caption[0])}</figcaption>}
        </div>
      </figure>
      {props.children}
    </SlateElement>
  )
}
