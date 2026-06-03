'use client'

import { useRef } from 'react'

import { SearchIcon, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSearch } from '@/hooks/use-search'
import { cn } from '@/lib/utils'

export const SearchInput = ({
  className,
  onChange,
  onClear,
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
  const { searchValue, setSearch } = useSearch({ urlKey })
  const controlled = onValueChange !== undefined
  const value = controlled ? String(valueProp ?? '') : searchValue
  const setValue = (next: string) => (controlled ? onValueChange(next) : setSearch(next))

  return (
    <div className="relative inline-flex items-center">
      <SearchIcon className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
      <Input
        className={cn('pr-8 pl-7.5', className)}
        onChange={e => {
          setValue(e.target.value)
          onChange?.(e)
        }}
        ref={inputRef}
        value={value}
        {...props}
      />
      {value && (
        <Button
          className="absolute right-1.5 size-5 rounded-sm p-0 hover:bg-muted"
          onClick={() => {
            setValue('')
            onClear?.()
            inputRef.current?.focus()
          }}
          size="text"
          type="button"
          variant="ghost"
        >
          <XIcon className="size-3 text-muted-foreground" />
        </Button>
      )}
    </div>
  )
}

const substringRanges = (value: string, query: string): [number, number][] => {
  if (!query) return []
  const ranges: [number, number][] = []
  const pattern = new RegExp(value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'giu')
  for (const match of value.matchAll(pattern)) ranges.push([match.index, match.index + match[0].length - 1])
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
  const ranges = query?.trim() ? substringRanges(value, query.trim()) : []
  if (ranges.length === 0) return <>{value}</>

  const segments: React.ReactNode[] = []
  let cursor = 0

  for (const [start, end] of ranges) {
    if (start > cursor) segments.push(value.slice(cursor, start))
    segments.push(
      <mark className="rounded-[3px] bg-amber-200/80 px-px text-current dark:bg-amber-500/40" key={start}>
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
