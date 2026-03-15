import { BaseTocPlugin, type Heading, isHeading } from '@platejs/toc'
import { cva } from 'class-variance-authority'
import { NodeApi, type SlateEditor, type TElement } from 'platejs'
import { SlateElement, type SlateElementProps } from 'platejs/static'

import { Button } from '@/components/ui/button'

const headingItemVariants = cva(
  `block h-auto w-full cursor-pointer truncate rounded-none px-0.5 py-1.5 text-left font-medium text-muted-foreground underline decoration-[0.5px] underline-offset-4 hover:bg-accent hover:text-muted-foreground`,
  {
    variants: {
      depth: {
        1: 'pl-0.5',
        2: 'pl-6.5',
        3: 'pl-12.5',
      },
    },
  }
)

export const TocElementStatic = (props: SlateElementProps) => {
  const { editor } = props
  const headingList = getHeadingList(editor)

  return (
    <SlateElement {...props} className="mb-1 p-0">
      <div>
        {headingList.length > 0 ? (
          headingList.map(item => (
            <Button
              className={headingItemVariants({
                depth: item.depth as 1 | 2 | 3,
              })}
              key={item.title}
              variant="ghost"
            >
              {item.title}
            </Button>
          ))
        ) : (
          <div className="text-sm text-gray-500">Create a heading to display the table of contents.</div>
        )}
      </div>
      {props.children}
    </SlateElement>
  )
}

const headingDepth: Record<string, number> = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  h6: 6,
}

const getHeadingList = (editor?: SlateEditor) => {
  if (!editor) {
    return []
  }

  const options = editor.getOptions(BaseTocPlugin)

  if (options.queryHeading) {
    return options.queryHeading(editor)
  }

  const headingList: Heading[] = []

  const values = editor.api.nodes({
    at: [],
    match: (n: TElement) => isHeading(n),
  })

  if (!values) {
    return []
  }

  Array.from(values, ([node, path]) => {
    const type = node.type as string
    const title = NodeApi.string(node)
    const depth = headingDepth[type]
    const id = node.id as string

    if (title) {
      headingList.push({ depth, id, path, title, type })
    }

    return null
  })

  return headingList
}
