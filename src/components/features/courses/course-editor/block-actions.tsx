'use client'

import { useRef, useState } from 'react'

import { AIChatPlugin } from '@platejs/ai/react'
import { useTranslations } from 'next-intl'
import { KEYS } from 'platejs'
import { useEditorRef, useEditorSelector, usePlateState } from 'platejs/react'

import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { setBlockType } from '@/components/ui/rich-text-editor/utils'
import { cn } from '@/lib/utils'

const TURN_INTO = [
  { key: 'paragraph', type: KEYS.p },
  { key: 'heading1', type: KEYS.h1 },
  { key: 'heading2', type: KEYS.h2 },
  { key: 'heading3', type: KEYS.h3 },
  { key: 'bulletList', type: KEYS.ul },
  { key: 'numberedList', type: KEYS.ol },
  { key: 'todoList', type: KEYS.listTodo },
  { key: 'quote', type: KEYS.blockquote },
] as const

export const BlockActions = ({ className, ...props }: React.ComponentProps<'div'>) => {
  const editor = useEditorRef()
  const t = useTranslations('CourseEditor')
  const tEditor = useTranslations('Components.RichTextEditor')
  const [readOnly] = usePlateState('readOnly')
  const [position, setPosition] = useState<{ count: number; index: number } | null>(null)
  const askAIRef = useRef(false)
  const lastIndexRef = useRef<number | null>(null)

  useEditorSelector(current => {
    const index = current.selection ? current.api.block({ highest: true })?.[1][0] : undefined
    if (index !== undefined) lastIndexRef.current = index
    return index
  }, [])

  if (readOnly) return null

  const readPosition = () => {
    const index = lastIndexRef.current
    if (index === null || index >= editor.children.length) return null
    return { count: editor.children.length, index }
  }

  const currentPath = () => {
    const found = readPosition()
    return found ? [found.index] : null
  }

  const move = (direction: -1 | 1) => {
    const path = currentPath()
    if (!path) return
    editor.tf.moveNodes({ at: path, to: [path[0] + direction] })
  }

  const duplicate = () => {
    const path = currentPath()
    if (!path) return
    editor.tf.duplicateNodes({ at: path, block: true })
  }

  const remove = () => {
    const path = currentPath()
    if (!path) return
    editor.tf.removeNodes({ at: path })
  }

  const turnInto = (type: string) => {
    const path = currentPath()
    if (!path) return
    setBlockType(editor, type, { at: path })
  }

  const hasBlock = position !== null

  return (
    <div className={cn('hidden justify-end pointer-coarse:flex', className)} {...props}>
      <DropdownMenu
        modal={false}
        onOpenChange={open => {
          if (open) setPosition(readPosition())
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={t('blockMenuLabel')}
            className="relative before:absolute before:inset-x-0 before:-inset-y-1 before:content-['']"
            icon="blocks"
            onMouseDown={event => event.preventDefault()}
            size="sm"
            variant="outline"
          >
            {t('blockMenu')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-52"
          onCloseAutoFocus={event => {
            event.preventDefault()
            if (askAIRef.current) {
              askAIRef.current = false
              editor.tf.focus()
              editor.getApi(AIChatPlugin).aiChat.show()
              return
            }
            editor.tf.focus()
          }}
        >
          <DropdownMenuItem disabled={!hasBlock || position.index === 0} onClick={() => move(-1)}>
            <LucideIcon aria-hidden name="arrow-up" />
            {t('moveBlockUp')}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!hasBlock || position.index >= position.count - 1} onClick={() => move(1)}>
            <LucideIcon aria-hidden name="arrow-down" />
            {t('moveBlockDown')}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!hasBlock} onClick={duplicate}>
            <LucideIcon aria-hidden name="copy" />
            {tEditor('actions.duplicate')}
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={!hasBlock}>
              <LucideIcon aria-hidden name="layers" />
              {tEditor('actions.turnInto')}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {TURN_INTO.map(({ key, type }) => (
                <DropdownMenuItem key={type} onClick={() => turnInto(type)}>
                  {tEditor(`blocks.${key}`)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem
            disabled={!hasBlock}
            onClick={() => {
              askAIRef.current = true
            }}
          >
            <LucideIcon aria-hidden name="sparkles" />
            {tEditor('ai.askAI')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={!hasBlock} onClick={remove} variant="destructive">
            <LucideIcon aria-hidden name="trash-2" />
            {tEditor('actions.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
