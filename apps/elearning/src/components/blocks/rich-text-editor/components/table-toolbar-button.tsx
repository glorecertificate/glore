'use client'

import { useState } from 'react'

import { TablePlugin, useTableMergeState } from '@platejs/table/react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Combine,
  Grid3x3Icon,
  Table,
  Trash2Icon,
  Ungroup,
  XIcon,
} from 'lucide-react'
import { KEYS } from 'platejs'
import { useEditorPlugin, useEditorSelector } from 'platejs/react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  type DropdownMenuProps,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ToolbarButton } from '@/components/ui/toolbar'
import { cn } from '@/lib/utils'
import { useI18n } from '../hooks/use-i18n'

export const TableToolbarButton = (props: DropdownMenuProps) => {
  const tableSelected = useEditorSelector(editor => editor.api.some({ match: { type: KEYS.table } }), [])
  const { editor, tf } = useEditorPlugin(TablePlugin)
  const mergeState = useTableMergeState()
  const { t } = useI18n('blocks')

  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu modal={false} onOpenChange={setOpen} open={open} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton isDropdown pressed={open} tooltip={t.table}>
          <Table />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="flex w-[180px] min-w-0 flex-col">
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
              <Grid3x3Icon className="size-4" />
              <span>{t.table}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="m-0 p-0">
              <TablePicker />
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              className="gap-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              disabled={!tableSelected}
            >
              <div className="size-4" />
              <span>{t.tableCell}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                className="min-w-[180px]"
                disabled={!mergeState.canMerge}
                onSelect={() => {
                  tf.table.merge()
                  editor.tf.focus()
                }}
              >
                <Combine />
                {t.tableMerge}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="min-w-[180px]"
                disabled={!mergeState.canSplit}
                onSelect={() => {
                  tf.table.split()
                  editor.tf.focus()
                }}
              >
                <Ungroup />
                {t.tableSplit}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              className="gap-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              disabled={!tableSelected}
            >
              <div className="size-4" />
              <span>{t.tableRow}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                className="min-w-[180px]"
                disabled={!tableSelected}
                onSelect={() => {
                  tf.insert.tableRow({ before: true })
                  editor.tf.focus()
                }}
              >
                <ArrowUp />
                {t.tableInsertRowBefore}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="min-w-[180px]"
                disabled={!tableSelected}
                onSelect={() => {
                  tf.insert.tableRow()
                  editor.tf.focus()
                }}
              >
                <ArrowDown />
                {t.tableInsertRowAfter}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="min-w-[180px]"
                disabled={!tableSelected}
                onSelect={() => {
                  tf.remove.tableRow()
                  editor.tf.focus()
                }}
              >
                <XIcon />
                {t.tableDeleteRow}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              className="gap-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              disabled={!tableSelected}
            >
              <div className="size-4" />
              <span>{t.tableColumn}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                className="min-w-[180px]"
                disabled={!tableSelected}
                onSelect={() => {
                  tf.insert.tableColumn({ before: true })
                  editor.tf.focus()
                }}
              >
                <ArrowLeft />
                {t.tableInsertColumnBefore}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="min-w-[180px]"
                disabled={!tableSelected}
                onSelect={() => {
                  tf.insert.tableColumn()
                  editor.tf.focus()
                }}
              >
                <ArrowRight />
                {t.tableInsertColumnAfter}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="min-w-[180px]"
                disabled={!tableSelected}
                onSelect={() => {
                  tf.remove.tableColumn()
                  editor.tf.focus()
                }}
              >
                <XIcon />
                {t.tableDeleteColumn}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem
            className="min-w-[180px]"
            disabled={!tableSelected}
            onSelect={() => {
              tf.remove.table()
              editor.tf.focus()
            }}
          >
            <Trash2Icon />
            {t.tableDelete}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const TablePicker = () => {
  const { editor, tf } = useEditorPlugin(TablePlugin)

  const [tablePicker, setTablePicker] = useState({
    grid: Array.from({ length: 8 }, () => Array.from({ length: 8 }).fill(0)),
    size: { colCount: 0, rowCount: 0 },
  })

  const onCellMove = (rowIndex: number, colIndex: number) => {
    const newGrid = [...tablePicker.grid]

    for (let i = 0; i < newGrid.length; i++) {
      for (let j = 0; j < newGrid[i].length; j++) {
        newGrid[i][j] = i >= 0 && i <= rowIndex && j >= 0 && j <= colIndex ? 1 : 0
      }
    }

    setTablePicker({
      grid: newGrid,
      size: { colCount: colIndex + 1, rowCount: rowIndex + 1 },
    })
  }

  return (
    <div
      className="flex! m-0 flex-col p-0"
      onClick={() => {
        tf.insert.table(tablePicker.size, { select: true })
        editor.tf.focus()
      }}
    >
      <div className="grid size-[130px] grid-cols-8 gap-0.5 p-1">
        {tablePicker.grid.map((rows, rowIndex) =>
          rows.map((value, columIndex) => (
            <div
              className={cn('col-span-1 size-3 border border-solid bg-secondary', !!value && 'border-current')}
              key={`(${rowIndex},${columIndex})`}
              onMouseMove={() => {
                onCellMove(rowIndex, columIndex)
              }}
            />
          ))
        )}
      </div>

      <div className="text-center text-current text-xs">
        {tablePicker.size.rowCount}
        {' x '}
        {tablePicker.size.colCount}
      </div>
    </div>
  )
}
