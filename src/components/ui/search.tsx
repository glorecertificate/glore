'use client'

import { useRef, useState } from 'react'

import { SearchIcon, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSearch } from '@/hooks/use-search'
import { cn } from '@/lib/utils'

export const SearchInput = ({
  blurOnEscape = true,
  className,
  hotkey,
  onBlur,
  onChange,
  onClear,
  onFocus,
  onValueChange,
  urlKey,
  value: valueProp,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'onChange'> & {
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear?: () => void
  onValueChange?: (value: string) => void
  urlKey?: string
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const { searchValue, setSearch } = useSearch({ urlKey })
  const controlled = onValueChange !== undefined
  const value = controlled ? String(valueProp ?? '') : searchValue
  const setValue = (next: string) => (controlled ? onValueChange(next) : setSearch(next))

  const showClear = Boolean(value) && (focused || !hotkey)
  const showHotkey = Boolean(hotkey) && !focused

  return (
    <div className="relative inline-flex items-center">
      <SearchIcon className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
      <Input
        blurOnEscape={blurOnEscape}
        className={cn('pr-8 pl-7.5', className)}
        hotkey={hotkey}
        onBlur={e => {
          setFocused(false)
          onBlur?.(e)
        }}
        onChange={e => {
          setValue(e.target.value)
          onChange?.(e)
        }}
        onFocus={e => {
          setFocused(true)
          onFocus?.(e)
        }}
        ref={inputRef}
        value={value}
        {...props}
      />
      {showClear && (
        <Button
          className="absolute right-1.5 size-5 rounded-sm p-0 hover:bg-muted"
          onClick={() => {
            setValue('')
            onClear?.()
            inputRef.current?.focus()
          }}
          onMouseDown={e => e.preventDefault()}
          size="text"
          type="button"
          variant="ghost"
        >
          <XIcon className="size-3 text-muted-foreground" />
        </Button>
      )}
      {showHotkey && (
        <kbd className="pointer-events-none absolute right-2 hidden size-5 items-center justify-center rounded-md border bg-muted text-[11px] font-medium text-muted-foreground sm:inline-flex">
          {hotkey}
        </kbd>
      )}
    </div>
  )
}

const highlightRanges = (value: string, query: string): [number, number][] => {
  if (!query) return []
  const ranges: [number, number][] = []
  const pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'giu')
  for (const match of value.matchAll(pattern)) {
    ranges.push([match.index, match.index + match[0].length - 1])
  }
  return ranges
}

export const SearchHighlight = ({
  className,
  query,
  value,
  ...props
}: Omit<React.ComponentProps<'span'>, 'children'> & {
  query?: string
  value?: string
}) => {
  if (!value) return null
  const ranges = query?.trim() ? highlightRanges(value, query.trim()) : []
  if (ranges.length === 0) return value

  const segments: React.ReactNode[] = []
  let cursor = 0

  for (const [start, end] of ranges) {
    if (start > cursor) segments.push(value.slice(cursor, start))
    segments.push(
      <mark className="rounded-[3px] bg-amber-200/40 text-current dark:bg-amber-500/20" key={start}>
        {value.slice(start, end + 1)}
      </mark>
    )
    cursor = end + 1
  }

  if (cursor < value.length) segments.push(value.slice(cursor))

  return (
    <span className={className} {...props}>
      {segments}
    </span>
  )
}
