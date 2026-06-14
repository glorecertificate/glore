'use client'

import { createContext, use, useState } from 'react'

import { CommandSeparator } from 'cmdk'
import { CheckIcon, ChevronsUpDownIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type ToastT, toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const MultiSelectContext = createContext<{
  disabled: boolean
  label?: string
  loading: boolean
  min: number
  open: boolean
  options: string[]
  resetOptions: () => void
  selectOption: (option: string) => void
  setOpen: (open: boolean) => void
  value: string[]
} | null>(null)

const useMultiSelect = () => {
  const context = use(MultiSelectContext)
  if (!context) {
    throw new Error('useMultiSelect must be used within a MultiSelectProvider')
  }
  return context
}

export const MultiSelect = ({
  children,
  disabled,
  label,
  loading,
  min = 0,
  onChange,
  options,
  toast: toastOptions,
  value,
  ...props
}: React.ComponentProps<typeof Popover> & {
  disabled?: boolean
  label?: string
  loading?: boolean
  min?: number
  onChange: (selected: string[]) => void
  options: string[]
  toast?: ToastT
  value: string[]
}) => {
  const t = useTranslations('Components.MultiSelect')

  const [open, setOpen] = useState(false)
  const [selectTime, setSelectTime] = useState<number | null>(null)

  const unselectOption = (option: string) => {
    if (value.length > min) {
      return onChange(value.filter(v => v !== option))
    }
    if (selectTime && Date.now() - selectTime < 2000) {
      return
    }
    toast.info(t('selectAtLeastOne', { item: (label ?? t('item')).toLowerCase() }), toastOptions)
    setSelectTime(Date.now())
  }

  const selectOption = (option: string) => {
    if (value.includes(option)) {
      return unselectOption(option)
    }
    const selected = options.find(o => o === option)
    if (!selected) {
      return
    }
    onChange([...value, selected])
  }

  const resetOptions = () => {
    onChange(options)
  }

  const contextValue = {
    disabled: Boolean(disabled),
    label,
    loading: Boolean(loading),
    min,
    open,
    options,
    resetOptions,
    selectOption,
    setOpen,
    value,
  }

  return (
    <MultiSelectContext.Provider value={contextValue}>
      <Popover onOpenChange={setOpen} open={open} {...props}>
        {children}
      </Popover>
    </MultiSelectContext.Provider>
  )
}

const scrollbarStyle: React.CSSProperties = {
  scrollbarColor: 'hsl(var(--border)) transparent',
  scrollbarWidth: 'thin',
}

export const MultiSelectTrigger = ({
  children,
  disabled: triggerDisabled,
  className,
  onClick,
  placeholder,
  position = 'end',
  ...props
}: React.ComponentProps<typeof PopoverTrigger> & {
  disabled?: boolean
  placeholder?: string
  /** @default 'start' */
  position?: 'start' | 'end'
}) => {
  const { disabled: rootDisabled, open, setOpen, value } = useMultiSelect()
  const disabled = rootDisabled || triggerDisabled

  const openDropdown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(!open)
  }

  const onTriggerClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) {
      return
    }
    onClick?.(e)
  }

  return (
    <PopoverTrigger
      aria-expanded={open}
      className={cn(
        'flex h-9 w-fit items-center justify-between rounded-md border border-input bg-background text-sm transition-all disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      disabled={disabled}
      onClick={onTriggerClick}
      {...props}
    >
      <div className={cn('flex flex-1 justify-between overflow-hidden', position === 'start' && 'flex-row-reverse')}>
        <div className="flex flex-1 gap-1 overflow-x-auto pr-2 pl-2.5" style={scrollbarStyle}>
          {value.length === 0 ? <span className="truncate text-muted-foreground">{placeholder}</span> : children}
        </div>
        <hr className="mx-0.5 my-auto h-6 border-l border-border" />
        <span
          className={cn(
            'my-auto mr-1 ml-1.5 h-full cursor-pointer rounded-sm p-1 outline-none hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            open && 'cursor-default bg-accent/50'
          )}
          onClick={openDropdown}
          onKeyDown={e => {
            if (e.key !== 'Enter' && e.key !== ' ') return
            e.preventDefault()
            e.stopPropagation()
            setOpen(!open)
          }}
          role="button"
          tabIndex={0}
        >
          <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
        </span>
      </div>
    </PopoverTrigger>
  )
}

export const MultiSelectBadge = ({
  children,
  className,
  disabled: badgeDisabled,
  disabledMessage,
  label,
  onClick,
  onKeyDown,
  tooltipDelay = 500,
  value,
  ...props
}: React.ComponentProps<typeof Badge> & {
  disabled?: boolean
  disabledMessage?: string
  label?: string
  tooltipDelay?: number
  value: string
}) => {
  const t = useTranslations('Components.MultiSelect')
  const { disabled: rootDisabled, label: rootLabel, selectOption } = useMultiSelect()
  const disabled = rootDisabled || badgeDisabled

  const title = (() => {
    if (disabled) {
      return
    }
    if (!(label || rootLabel)) {
      return t('removeItem')
    }
    return `${t('remove')} ${label ?? rootLabel}`
  })()

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (disabled || e.key !== 'Enter') return
    selectOption(value)
    onKeyDown?.(e)
  }

  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    selectOption(value)
    onClick?.(e)
  }

  const badge = (
    <Badge
      asChild
      className={cn(
        'group/multi-select-badge gap-0.5 px-2',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      title={title}
      {...props}
    >
      <span>
        {children ?? label}
        <span
          className={cn(
            'translate-x-0.75 rounded-full p-[1.5px] transition-all',
            !disabled && [
              'group-hover/multi-select-badge:border-destructive-accent group-hover/multi-select-badge:bg-destructive/75 group-hover/multi-select-badge:text-destructive-foreground',
              'group-focus/multi-select-badge:border-destructive-accent group-focus/multi-select-badge:bg-destructive/75 group-focus/multi-select-badge:text-destructive-foreground',
            ]
          )}
        >
          <XIcon className={cn('size-2', !disabled && 'group-hover/multi-select-badge:stroke-white')} />
        </span>
      </span>
    </Badge>
  )

  if (!(disabled && disabledMessage)) {
    return badge
  }

  return (
    <Tooltip delayDuration={tooltipDelay} disableHoverableContent>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent align="center" className="text-[11px]" side="top">
        {disabledMessage}
      </TooltipContent>
    </Tooltip>
  )
}

export const MultiSelectBadgeCount = ({ children, className, ...props }: React.ComponentProps<typeof Badge>) => {
  const t = useTranslations('Components.MultiSelect')
  const { open, setOpen } = useMultiSelect()

  const toggleSelect = () => {
    if (!open) {
      setOpen(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      toggleSelect()
    }
  }

  return (
    <Badge
      className={cn('cursor-pointer gap-0.5 px-2', className)}
      onClick={toggleSelect}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      title={t('seeAllSelected')}
      {...props}
    >
      {children}
    </Badge>
  )
}

export const MultiSelectItem = ({
  children,
  className,
  label,
  value,
  ...props
}: React.ComponentProps<typeof CommandItem> & {
  label?: string
  value: string
}) => {
  const { min, selectOption, value: rootValue } = useMultiSelect()
  const selected = rootValue.includes(value)

  const onSelect = () => selectOption(value)

  return (
    <CommandItem
      className={cn(
        'group/item w-full pr-6',
        selected ? (rootValue.length === min ? 'cursor-not-allowed' : 'cursor-default') : 'cursor-pointer',
        className
      )}
      onSelect={onSelect}
      value={value}
      {...props}
    >
      <CheckIcon className={cn('size-4', selected ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-30')} />
      <div className="flex items-center gap-1.5">{children ?? label}</div>
    </CommandItem>
  )
}

export const MultiSelectContent = ({
  children,
  className,
  enableSearch,
  enableSelectAll = true,
  searchPlaceholder,
  selectAllLabel,
  ...props
}: React.ComponentProps<typeof PopoverContent> & {
  enableSearch?: boolean
  /** @default true */
  enableSelectAll?: boolean
  searchPlaceholder?: string
  selectAllLabel?: string
}) => {
  const t = useTranslations('Common')
  const { loading, options, resetOptions, value } = useMultiSelect()

  return (
    <PopoverContent className={cn('w-fit p-0', className)} {...props}>
      <Command>
        {enableSearch && <CommandInput autoFocus placeholder={searchPlaceholder ?? t('searchItems')} />}
        <CommandList>
          <CommandEmpty className="p-0">
            {loading ? (
              <div className="p-2">
                {Array.from({ length: options.length }).map((_, i) => (
                  <Skeleton className="mb-1 h-4 w-full last:mb-0" key={i} />
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-muted-foreground">{'No items found.'}</div>
            )}
          </CommandEmpty>
          <CommandGroup>
            {children}
            {value.length < options.length && enableSelectAll && (
              <>
                <CommandSeparator />
                <CommandItem
                  className="cursor-pointer"
                  disabled={options.length === value.length}
                  onSelect={resetOptions}
                  value="all"
                >
                  {selectAllLabel ?? t('selectAll')}
                </CommandItem>
              </>
            )}
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  )
}
