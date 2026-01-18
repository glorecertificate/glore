'use client'

import { useMediaState } from '@platejs/media/react'
import { ResizableProvider } from '@platejs/resizable'
import { type TAudioElement } from 'platejs'
import { PlateElement, type PlateElementProps, withHOC } from 'platejs/react'

import { Caption, CaptionTextarea } from '@/components/blocks/rich-text-editor/ui/caption'

export const AudioElement = withHOC(ResizableProvider, (props: PlateElementProps<TAudioElement>) => {
  const { align = 'center', readOnly, unsafeUrl } = useMediaState()

  return (
    <PlateElement {...props} className="mb-1">
      <figure className="group relative cursor-default" contentEditable={false}>
        <div className="h-16">
          <audio className="size-full" controls src={unsafeUrl} />
        </div>

        <Caption align={align} style={{ width: '100%' }}>
          <CaptionTextarea className="h-20" placeholder="Write a caption..." readOnly={readOnly} />
        </Caption>
      </figure>
      {props.children}
    </PlateElement>
  )
})
