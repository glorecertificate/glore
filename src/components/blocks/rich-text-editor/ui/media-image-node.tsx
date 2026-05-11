'use client'

import { useDraggable } from '@platejs/dnd'
import { Image, ImagePlugin, useMediaState } from '@platejs/media/react'
import { ResizableProvider, useResizableValue } from '@platejs/resizable'
import { type TImageElement } from 'platejs'
import { PlateElement, type PlateElementProps, withHOC } from 'platejs/react'

import { Caption, CaptionTextarea } from '@/components/blocks/rich-text-editor/ui/caption'
import { MediaToolbar } from '@/components/blocks/rich-text-editor/ui/media-toolbar'
import {
  Resizable,
  ResizeHandle,
  mediaResizeHandleVariants,
} from '@/components/blocks/rich-text-editor/ui/resize-handle'
import { cn } from '@/lib/utils'

const leftResizeOptions = { direction: 'left' } as const
const rightResizeOptions = { direction: 'right' } as const

export const ImageElement = withHOC(ResizableProvider, (props: PlateElementProps<TImageElement>) => {
  const { align = 'center', focused, readOnly, selected } = useMediaState()
  const width = useResizableValue('width')

  const { handleRef, isDragging } = useDraggable({
    element: props.element,
  })

  const resizableOptions = { align, readOnly }
  const captionStyle = { width: width as string }

  return (
    <MediaToolbar plugin={ImagePlugin}>
      <PlateElement {...props} className="py-2.5">
        <figure className="group relative m-0" contentEditable={false}>
          <Resizable align={align} options={resizableOptions}>
            <ResizeHandle className={mediaResizeHandleVariants({ direction: 'left' })} options={leftResizeOptions} />
            <Image
              alt={props.attributes.alt as string | undefined}
              className={cn(
                'block w-full max-w-full cursor-pointer object-cover px-0',
                'rounded-sm',
                focused && selected && 'ring-2 ring-ring ring-offset-2',
                isDragging && 'opacity-50'
              )}
              ref={handleRef}
            />
            <ResizeHandle
              className={mediaResizeHandleVariants({
                direction: 'right',
              })}
              options={rightResizeOptions}
            />
          </Resizable>

          <Caption align={align} style={captionStyle}>
            <CaptionTextarea
              onFocus={e => {
                e.preventDefault()
              }}
              placeholder="Write a caption..."
              readOnly={readOnly}
            />
          </Caption>
        </figure>

        {props.children}
      </PlateElement>
    </MediaToolbar>
  )
})
