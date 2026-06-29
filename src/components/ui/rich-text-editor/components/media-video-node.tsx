'use client'

import dynamic from 'next/dynamic'

import { useDraggable } from '@platejs/dnd'
import { parseTwitterUrl, parseVideoUrl } from '@platejs/media'
import { useMediaState } from '@platejs/media/react'
import { ResizableProvider, useResizableValue } from '@platejs/resizable'
import { type TResizableProps, type TVideoElement } from 'platejs'
import { PlateElement, type PlateElementProps, useEditorMounted, withHOC } from 'platejs/react'
import LiteYouTubeEmbed from 'react-lite-youtube-embed'

import { Caption, CaptionTextarea } from '@/components/ui/rich-text-editor/components/caption'
import {
  Resizable,
  ResizeHandle,
  mediaResizeHandleVariants,
} from '@/components/ui/rich-text-editor/components/resize-handle'
import { cn } from '@/lib/utils'

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false })

const leftResizeOptions = { direction: 'left' } as const
const rightResizeOptions = { direction: 'right' } as const

export const VideoElement = withHOC(ResizableProvider, (props: PlateElementProps<TVideoElement & TResizableProps>) => {
  const {
    align = 'center',
    embed,
    isUpload,
    isYoutube,
    readOnly,
    unsafeUrl,
  } = useMediaState({
    urlParsers: [parseTwitterUrl, parseVideoUrl],
  })
  const width = useResizableValue('width')

  const isEditorMounted = useEditorMounted()

  const isTweet = true

  const { handleRef, isDragging } = useDraggable({
    element: props.element,
  })

  const resizableOptions = { align, maxWidth: isTweet ? 550 : '100%', minWidth: isTweet ? 300 : 100, readOnly }
  const captionStyle = { width: width as string }

  return (
    <PlateElement className="py-2.5" {...props}>
      <figure className="relative m-0 cursor-default" contentEditable={false}>
        <Resizable align={align} className={cn(isDragging && 'opacity-50')} options={resizableOptions}>
          <div className="group/media">
            <ResizeHandle className={mediaResizeHandleVariants({ direction: 'left' })} options={leftResizeOptions} />

            <ResizeHandle className={mediaResizeHandleVariants({ direction: 'right' })} options={rightResizeOptions} />

            {!isUpload && isYoutube && (
              <div ref={handleRef}>
                <LiteYouTubeEmbed
                  id={embed?.id ?? ''}
                  title="youtube"
                  wrapperClass={cn(
                    'aspect-video rounded-sm',
                    'relative block cursor-pointer bg-black bg-cover bg-center contain-content',
                    `[&.lyt-activated]:before:absolute [&.lyt-activated]:before:top-0 [&.lyt-activated]:before:h-15 [&.lyt-activated]:before:w-full [&.lyt-activated]:before:bg-top [&.lyt-activated]:before:bg-repeat-x [&.lyt-activated]:before:pb-12.5 [&.lyt-activated]:before:[transition:all_0.2s_cubic-bezier(0,0,0.2,1)]`,
                    `[&.lyt-activated]:before:bg-[url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAADGCAYAAAAT+OqFAAAAdklEQVQoz42QQQ7AIAgEF/T/D+kbq/RWAlnQyyazA4aoAB4FsBSA/bFjuF1EOL7VbrIrBuusmrt4ZZORfb6ehbWdnRHEIiITaEUKa5EJqUakRSaEYBJSCY2dEstQY7AuxahwXFrvZmWl2rh4JZ07z9dLtesfNj5q0FU3A5ObbwAAAABJRU5ErkJggg==)]`,
                    'after:block after:pb-(--aspect-ratio) after:content-[""]',
                    '[&_>_iframe]:absolute [&_>_iframe]:top-0 [&_>_iframe]:left-0 [&_>_iframe]:size-full',
                    // eslint-disable-next-line tailwindcss/no-hardcoded-colors
                    `[&_>_.lty-playbtn]:z-1 [&_>_.lty-playbtn]:h-11.5 [&_>_.lty-playbtn]:w-17.5 [&_>_.lty-playbtn]:rounded-[14%] [&_>_.lty-playbtn]:bg-[#212121] [&_>_.lty-playbtn]:opacity-80 [&_>_.lty-playbtn]:[transition:all_0.2s_cubic-bezier(0,0,0.2,1)]`,
                    '[&:hover_>_.lty-playbtn]:bg-[red] [&:hover_>_.lty-playbtn]:opacity-100',
                    `[&_>_.lty-playbtn]:before:border-y-11 [&_>_.lty-playbtn]:before:border-r-0 [&_>_.lty-playbtn]:before:border-l-19 [&_>_.lty-playbtn]:before:border-[transparent_transparent_transparent_#fff] [&_>_.lty-playbtn]:before:content-[""]`,
                    `[&_>_.lty-playbtn]:absolute [&_>_.lty-playbtn]:top-1/2 [&_>_.lty-playbtn]:left-1/2 [&_>_.lty-playbtn]:transform-[translate3d(-50%,-50%,0)]`,
                    `[&_>_.lty-playbtn]:before:absolute [&_>_.lty-playbtn]:before:top-1/2 [&_>_.lty-playbtn]:before:left-1/2 [&_>_.lty-playbtn]:before:transform-[translate3d(-50%,-50%,0)]`,
                    '[&.lyt-activated]:cursor-[unset]',
                    '[&.lyt-activated]:before:pointer-events-none [&.lyt-activated]:before:opacity-0',
                    '[&.lyt-activated_>_.lty-playbtn]:pointer-events-none [&.lyt-activated_>_.lty-playbtn]:opacity-0!'
                  )}
                />
              </div>
            )}

            {isUpload && isEditorMounted && (
              <div ref={handleRef}>
                <ReactPlayer controls height="100%" oEmbedUrl={unsafeUrl} width="100%" />
              </div>
            )}
          </div>
        </Resizable>

        <Caption align={align} style={captionStyle}>
          <CaptionTextarea placeholder="Write a caption..." readOnly={readOnly} />
        </Caption>
      </figure>
      {props.children}
    </PlateElement>
  )
})
