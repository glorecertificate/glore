'use client'

import { ListStyleType, someList, toggleList } from '@platejs/list'
import { useIndentTodoToolBarButton, useIndentTodoToolBarButtonState } from '@platejs/list/react'
import { List, ListOrdered, ListTodoIcon } from 'lucide-react'
import { useEditorRef, useEditorSelector } from 'platejs/react'
import { useState } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu'
import {
  ToolbarButton,
  ToolbarSplitButton,
  ToolbarSplitButtonPrimary,
  ToolbarSplitButtonSecondary,
} from '@repo/ui/components/toolbar'

import { useI18n } from '../hooks/use-i18n'

export const BulletedListToolbarButton = ({ tooltip }: { tooltip?: string }) => {
  const editor = useEditorRef()
  const { t } = useI18n('blocks')

  const [open, setOpen] = useState(false)

  const pressed = useEditorSelector(
    editor => someList(editor, [ListStyleType.Disc, ListStyleType.Circle, ListStyleType.Square]),
    [],
  )

  return (
    <ToolbarSplitButton pressed={open}>
      <ToolbarSplitButtonPrimary
        className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
        data-state={pressed ? 'on' : 'off'}
        onClick={() => {
          toggleList(editor, {
            listStyleType: ListStyleType.Disc,
          })
        }}
        tooltip={tooltip}
      >
        <List className="size-4" />
      </ToolbarSplitButtonPrimary>

      <DropdownMenu modal={false} onOpenChange={setOpen} open={open}>
        <DropdownMenuTrigger asChild>
          <ToolbarSplitButtonSecondary />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" alignOffset={-32}>
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.Disc,
                })
              }
            >
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full border border-current bg-current" />
                {t.unorderedListDefault}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.Circle,
                })
              }
            >
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full border border-current" />
                {t.unorderedListCircle}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.Square,
                })
              }
            >
              <div className="flex items-center gap-2">
                <div className="size-2 border border-current bg-current" />
                {t.unorderedListSquare}
              </div>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ToolbarSplitButton>
  )
}

export const NumberedListToolbarButton = ({ tooltip }: { tooltip?: string }) => {
  const editor = useEditorRef()
  const { t } = useI18n('blocks')
  const [open, setOpen] = useState(false)

  const pressed = useEditorSelector(
    editor =>
      someList(editor, [
        ListStyleType.Decimal,
        ListStyleType.LowerAlpha,
        ListStyleType.UpperAlpha,
        ListStyleType.LowerRoman,
        ListStyleType.UpperRoman,
      ]),
    [],
  )

  return (
    <ToolbarSplitButton pressed={open}>
      <ToolbarSplitButtonPrimary
        className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
        data-state={pressed ? 'on' : 'off'}
        onClick={() =>
          toggleList(editor, {
            listStyleType: ListStyleType.Decimal,
          })
        }
        tooltip={tooltip}
      >
        <ListOrdered className="size-4" />
      </ToolbarSplitButtonPrimary>

      <DropdownMenu modal={false} onOpenChange={setOpen} open={open}>
        <DropdownMenuTrigger asChild>
          <ToolbarSplitButtonSecondary />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" alignOffset={-32}>
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.Decimal,
                })
              }
            >
              {t.numberedListDecimal}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.LowerAlpha,
                })
              }
            >
              {t.numberedListLowerAlpha}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.UpperAlpha,
                })
              }
            >
              {t.numberedListUpperAlpha}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.LowerRoman,
                })
              }
            >
              {t.numberedListLowerRoman}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.UpperRoman,
                })
              }
            >
              {t.numberedListUpperRoman}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ToolbarSplitButton>
  )
}

export const TodoListToolbarButton = (props: React.ComponentProps<typeof ToolbarButton>) => {
  const state = useIndentTodoToolBarButtonState({ nodeType: 'todo' })
  const { props: buttonProps } = useIndentTodoToolBarButton(state)
  const { t } = useI18n('blocks')

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip={t.todoList}>
      <ListTodoIcon />
    </ToolbarButton>
  )
}
