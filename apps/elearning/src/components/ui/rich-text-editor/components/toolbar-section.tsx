import { useCallback, useMemo } from 'react'

import { CaretDownIcon } from '@radix-ui/react-icons'
import type { Editor } from '@tiptap/react'
import type { VariantProps } from 'class-variance-authority'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ShortcutKey } from '@/components/ui/rich-text-editor/components/shortcut-key'
import { ToolbarButton } from '@/components/ui/rich-text-editor/components/toolbar-button'
import type { FormatAction } from '@/components/ui/rich-text-editor/types'
import { getShortcutKey } from '@/components/ui/rich-text-editor/utils'
import type { toggleVariants } from '@/components/ui/toggle'
import { cn } from '@/lib/utils'

export interface ToolbarSectionProps extends VariantProps<typeof toggleVariants> {
  editor: Editor
  actions: FormatAction[]
  activeActions?: string[]
  mainActionCount?: number
  dropdownIcon?: React.ReactNode
  dropdownTooltip?: string
  dropdownClassName?: string
}

export const ToolbarSection: React.FC<ToolbarSectionProps> = ({
  editor,
  actions,
  activeActions = actions.map(action => action.value),
  mainActionCount = 0,
  dropdownIcon,
  dropdownTooltip = 'More options',
  dropdownClassName = 'w-12',
  size,
  variant,
}) => {
  const { dropdownActions, mainActions } = useMemo(() => {
    const sortedActions = actions
      .filter(action => activeActions.includes(action.value))
      .sort((a, b) => activeActions.indexOf(a.value) - activeActions.indexOf(b.value))

    return {
      mainActions: sortedActions.slice(0, mainActionCount),
      dropdownActions: sortedActions.slice(mainActionCount),
    }
  }, [actions, activeActions, mainActionCount])

  const renderToolbarButton = useCallback(
    (action: FormatAction) => (
      <ToolbarButton
        aria-label={action.label}
        disabled={!action.canExecute(editor)}
        isActive={action.isActive(editor)}
        key={action.label}
        onClick={() => action.action(editor)}
        size={size}
        tooltip={`${action.label} ${action.shortcuts.map(s => getShortcutKey(s).symbol).join(' ')}`}
        variant={variant}
      >
        {action.icon}
      </ToolbarButton>
    ),
    [editor, size, variant],
  )

  const renderDropdownMenuItem = useCallback(
    (action: FormatAction) => (
      <DropdownMenuItem
        aria-label={action.label}
        className={cn('flex flex-row items-center justify-between gap-4', {
          'bg-accent': action.isActive(editor),
        })}
        disabled={!action.canExecute(editor)}
        key={action.label}
        onClick={() => action.action(editor)}
      >
        <span className="grow">{action.label}</span>
        <ShortcutKey keys={action.shortcuts} />
      </DropdownMenuItem>
    ),
    [editor],
  )

  const isDropdownActive = useMemo(
    () => dropdownActions.some(action => action.isActive(editor)),
    [dropdownActions, editor],
  )

  return (
    <>
      {mainActions.map(renderToolbarButton)}
      {dropdownActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ToolbarButton
              aria-label={dropdownTooltip}
              className={cn(dropdownClassName)}
              isActive={isDropdownActive}
              size={size}
              tooltip={dropdownTooltip}
              variant={variant}
            >
              {dropdownIcon || <CaretDownIcon className="size-5" />}
            </ToolbarButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-full">
            {dropdownActions.map(renderDropdownMenuItem)}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  )
}
