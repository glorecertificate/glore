import { FileUpIcon } from 'lucide-react'
import { SlateElement, type SlateElementProps, type TFileElement } from 'platejs'

export const FileElementStatic = (props: SlateElementProps<TFileElement>) => {
  const { name, url } = props.element

  return (
    <SlateElement className="my-px rounded-sm" {...props}>
      <a
        className="group relative m-0 flex cursor-pointer items-center rounded-sm px-0.5 py-[3px] hover:bg-muted"
        contentEditable={false}
        download={name}
        href={url}
        rel="noopener noreferrer"
        role="button"
        target="_blank"
      >
        <div className="flex items-center gap-1 p-1">
          <FileUpIcon className="size-5" />
          <div>{name}</div>
        </div>
      </a>
      {props.children}
    </SlateElement>
  )
}
