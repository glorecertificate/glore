'use client'

import { useEffect, useRef, useState } from 'react'

import { useEquationElement, useEquationInput } from '@platejs/math/react'
import { BlockSelectionPlugin } from '@platejs/selection/react'
import { CornerDownLeftIcon, RadicalIcon } from 'lucide-react'
import { type TEquationElement } from 'platejs'
import {
  PlateElement,
  type PlateElementProps,
  createPrimitiveComponent,
  useEditorRef,
  useEditorSelector,
  useElement,
  useReadOnly,
  useSelected,
} from 'platejs/react'
import TextareaAutosize, { type TextareaAutosizeProps } from 'react-textarea-autosize'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export const EquationElement = (props: PlateElementProps<TEquationElement>) => {
  const selected = useSelected()
  const [open, setOpen] = useState(selected)
  const katexRef = useRef<HTMLDivElement | null>(null)

  useEquationElement({
    element: props.element,
    katexRef,
    options: {
      displayMode: true,
      errorColor: '#cc0000',
      fleqn: false,
      leqno: false,
      macros: { '\\f': '#1f(#2)' },
      output: 'htmlAndMathml',
      strict: 'warn',
      throwOnError: false,
      trust: false,
    },
  })

  return (
    <PlateElement className="my-1" {...props}>
      <Popover modal={false} onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild>
          <div
            className={cn(
              'group flex cursor-pointer select-none items-center justify-center rounded-sm hover:bg-primary/10 data-[selected=true]:bg-primary/10',
              props.element.texExpression.length === 0 ? 'bg-muted p-3 pr-9' : 'px-2 py-1'
            )}
            contentEditable={false}
            data-selected={selected}
            role="button"
          >
            {props.element.texExpression.length > 0 ? (
              <span ref={katexRef} />
            ) : (
              <div className="flex h-7 w-full items-center gap-2 whitespace-nowrap text-muted-foreground text-sm">
                <RadicalIcon className="size-6 text-muted-foreground/80" />
                <div>{'Add a Tex equation'}</div>
              </div>
            )}
          </div>
        </PopoverTrigger>

        <EquationPopoverContent
          isInline={false}
          open={open}
          placeholder={
            'f(x) = \\begin{cases}\n  x^2, &\\quad x > 0 \\\\\n  0, &\\quad x = 0 \\\\\n  -x^2, &\\quad x < 0\n\\end{cases}'
          }
          setOpen={setOpen}
        />
      </Popover>

      {props.children}
    </PlateElement>
  )
}

export const InlineEquationElement = (props: PlateElementProps<TEquationElement>) => {
  const element = props.element
  const katexRef = useRef<HTMLDivElement | null>(null)
  const selected = useSelected()
  const isCollapsed = useEditorSelector(editor => editor.api.isCollapsed(), [])
  const [open, setOpen] = useState(selected && isCollapsed)

  useEffect(() => {
    if (selected && isCollapsed) {
      setOpen(true)
    }
  }, [selected, isCollapsed])

  useEquationElement({
    element,
    katexRef,
    options: {
      displayMode: true,
      errorColor: '#cc0000',
      fleqn: false,
      leqno: false,
      macros: { '\\f': '#1f(#2)' },
      output: 'htmlAndMathml',
      strict: 'warn',
      throwOnError: false,
      trust: false,
    },
  })

  return (
    <PlateElement {...props} className={cn('mx-1 inline-block select-none rounded-sm [&_.katex-display]:my-0!')}>
      <Popover modal={false} onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild>
          <div
            className={cn(
              `after:-top-0.5 after:-left-1 after:absolute after:inset-0 after:z-1 after:h-[calc(100%)+4px] after:w-[calc(100%+8px)] after:rounded-sm after:content-[""]`,
              'h-6',
              ((element.texExpression.length > 0 && open) || selected) && 'after:bg-brand/15',
              element.texExpression.length === 0 && 'text-muted-foreground after:bg-neutral-500/10'
            )}
            contentEditable={false}
          >
            <span
              className={cn(element.texExpression.length === 0 && 'hidden', 'font-mono leading-none')}
              ref={katexRef}
            />
            {element.texExpression.length === 0 && (
              <span>
                <RadicalIcon className="mr-1 inline-block h-[19px] w-4 py-[1.5px] align-text-bottom" />
                {'New equation'}
              </span>
            )}
          </div>
        </PopoverTrigger>

        <EquationPopoverContent className="my-auto" isInline open={open} placeholder="E = mc^2" setOpen={setOpen} />
      </Popover>

      {props.children}
    </PlateElement>
  )
}

const EquationInput = createPrimitiveComponent(TextareaAutosize)({
  propsHook: useEquationInput,
})

const EquationPopoverContent = ({
  className,
  isInline,
  open,
  setOpen,
  ...props
}: {
  isInline: boolean
  open: boolean
  setOpen: (open: boolean) => void
} & TextareaAutosizeProps) => {
  const editor = useEditorRef()
  const readOnly = useReadOnly()
  const element = useElement<TEquationElement>()

  useEffect(() => {
    if (isInline && open) {
      setOpen(true)
    }
  }, [isInline, open, setOpen])

  if (readOnly) return null

  const onClose = () => {
    setOpen(false)

    if (isInline) {
      editor.tf.select(element, { focus: true, next: true })
    } else {
      editor.getApi(BlockSelectionPlugin).blockSelection.set(element.id as string)
    }
  }

  return (
    <PopoverContent
      className="flex gap-2"
      contentEditable={false}
      onEscapeKeyDown={e => {
        e.preventDefault()
      }}
    >
      <EquationInput
        autoFocus
        className={cn('max-h-[50vh] grow resize-none p-2 text-sm', className)}
        state={{ isInline, open, onClose }}
        {...props}
      />

      <Button className="px-3" onClick={onClose} variant="secondary">
        {'Done '}
        <CornerDownLeftIcon className="size-3.5" />
      </Button>
    </PopoverContent>
  )
}
