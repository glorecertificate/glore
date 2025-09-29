import { SlateElement, type SlateElementProps, type TAudioElement } from 'platejs'

export const AudioElementStatic = (props: SlateElementProps<TAudioElement>) => (
  <SlateElement {...props} className="mb-1">
    <figure className="group relative cursor-default">
      <div className="h-16">
        <audio className="size-full" controls src={props.element.url} />
      </div>
    </figure>
    {props.children}
  </SlateElement>
)
