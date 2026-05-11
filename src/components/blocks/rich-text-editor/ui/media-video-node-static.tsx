import { NodeApi, type TCaptionElement, type TResizableProps, type TVideoElement } from 'platejs'
import { SlateElement, type SlateElementProps } from 'platejs/static'

export const VideoElementStatic = (props: SlateElementProps<TVideoElement & TCaptionElement & TResizableProps>) => {
  const { align = 'center', caption, url, width } = props.element

  const divStyle = { textAlign: align as React.CSSProperties['textAlign'] }
  const figureStyle = { width }

  return (
    <SlateElement className="py-2.5" {...props}>
      <div style={divStyle}>
        <figure className="group relative m-0 inline-block cursor-default" style={figureStyle}>
          <video className="w-full max-w-full rounded-sm object-cover px-0" controls src={url} />
          {caption && <figcaption>{NodeApi.string(caption[0])}</figcaption>}
        </figure>
      </div>
      {props.children}
    </SlateElement>
  )
}
