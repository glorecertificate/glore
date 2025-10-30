'use client'

import { useMediaState } from '@platejs/media/react'
import { ResizableProvider } from '@platejs/resizable'
import { FileUpIcon } from 'lucide-react'
import { type TFileElement } from 'platejs'
import { PlateElement, type PlateElementProps, useReadOnly, withHOC } from 'platejs/react'

import { Caption, CaptionTextarea } from '@/components/blocks/rich-text-editor/ui/caption'

export const FileElement = withHOC(ResizableProvider, (props: PlateElementProps<TFileElement>) => {
  const readOnly = useReadOnly()
  const { name, unsafeUrl } = useMediaState()

  return (
    <PlateElement className="my-px rounded-sm" {...props}>
      <a
        className="group relative m-0 flex cursor-pointer items-center rounded-sm px-0.5 py-[3px] hover:bg-muted"
        contentEditable={false}
        download={name}
        href={unsafeUrl}
        rel="noopener noreferrer"
        role="button"
        target="_blank"
      >
        <div className="flex items-center gap-1 p-1">
          <FileUpIcon className="size-5" />
          <div>{name}</div>
        </div>

        <Caption align="left">
          <CaptionTextarea className="text-left" placeholder="Write a caption..." readOnly={readOnly} />
        </Caption>
      </a>
      {props.children}
    </PlateElement>
  )
})
