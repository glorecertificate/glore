'use client'

import { useCallback, useState } from 'react'

import { AIChatPlugin } from '@platejs/ai/react'
import { BLOCK_CONTEXT_MENU_ID, BlockMenuPlugin, BlockSelectionPlugin } from '@platejs/selection/react'
import { KEYS } from 'platejs'
import { useEditorPlugin, usePlateState } from 'platejs/react'

import { useDevice } from '@/hooks/use-device'
import { useTranslations } from '@/hooks/use-translations'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@rte/blocks/context-menu'

type Value = 'askAI' | null

export const BlockContextMenu = ({ children }: { children: React.ReactNode }) => {
  const t = useTranslations('Editor')
  const { api, editor } = useEditorPlugin(BlockMenuPlugin)
  const [value, setValue] = useState<Value>(null)
  const { isTouch } = useDevice()
  const [readOnly] = usePlateState('readOnly')

  const handleTurnInto = useCallback(
    (type: string) => {
      editor
        .getApi(BlockSelectionPlugin)
        .blockSelection.getNodes()
        .forEach(([node, path]) => {
          if (node[KEYS.listType]) {
            editor.tf.unsetNodes([KEYS.listType, 'indent'], {
              at: path,
            })
          }

          editor.tf.toggleBlock(type, { at: path })
        })
    },
    [editor],
  )

  const handleAlign = useCallback(
    (align: 'center' | 'left' | 'right') => {
      editor.getTransforms(BlockSelectionPlugin).blockSelection.setNodes({ align })
    },
    [editor],
  )

  if (isTouch) {
    return children
  }

  return (
    <ContextMenu
      modal={false}
      onOpenChange={open => {
        if (open) return
        setTimeout(() => api.blockMenu.hide(), 0)
      }}
    >
      <ContextMenuTrigger
        asChild
        onContextMenu={event => {
          const dataset = (event.target as HTMLElement).dataset
          const disabled = dataset?.slateEditor === 'true' || readOnly

          if (disabled) return event.preventDefault()

          api.blockMenu.show(BLOCK_CONTEXT_MENU_ID, { x: event.clientX, y: event.clientY })
        }}
      >
        <div className="w-full">{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent
        className="w-64"
        onCloseAutoFocus={e => {
          e.preventDefault()
          editor.getApi(BlockSelectionPlugin).blockSelection.focus()

          if (value === 'askAI') {
            editor.getApi(AIChatPlugin).aiChat.show()
          }

          setValue(null)
        }}
      >
        <ContextMenuGroup>
          <ContextMenuItem
            onClick={() => {
              setValue('askAI')
            }}
          >
            {t('ai.askAI')}
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              editor.getTransforms(BlockSelectionPlugin).blockSelection.removeNodes()
              editor.tf.focus()
            }}
          >
            {t('actions.delete')}
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              editor.getTransforms(BlockSelectionPlugin).blockSelection.duplicate()
            }}
          >
            {t('actions.duplicate')}
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>{t('actions.turnInto')}</ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuItem onClick={() => handleTurnInto(KEYS.p)}>{t('blocks.paragraph')}</ContextMenuItem>
              <ContextMenuItem onClick={() => handleTurnInto(KEYS.h1)}>{t('blocks.heading1')}</ContextMenuItem>
              <ContextMenuItem onClick={() => handleTurnInto(KEYS.h2)}>{t('blocks.heading2')}</ContextMenuItem>
              <ContextMenuItem onClick={() => handleTurnInto(KEYS.h3)}>{t('blocks.heading3')}</ContextMenuItem>
              <ContextMenuItem onClick={() => handleTurnInto(KEYS.blockquote)}>{t('blocks.quote')}</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuGroup>

        <ContextMenuGroup>
          <ContextMenuItem onClick={() => editor.getTransforms(BlockSelectionPlugin).blockSelection.setIndent(1)}>
            {t('actions.indent')}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => editor.getTransforms(BlockSelectionPlugin).blockSelection.setIndent(-1)}>
            {t('actions.outdent')}
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>{t('actions.align')}</ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuItem onClick={() => handleAlign('left')}>{t('blocks.alignLeft')}</ContextMenuItem>
              <ContextMenuItem onClick={() => handleAlign('center')}>{t('blocks.alignCenter')}</ContextMenuItem>
              <ContextMenuItem onClick={() => handleAlign('right')}>{t('blocks.alignRight')}</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  )
}
