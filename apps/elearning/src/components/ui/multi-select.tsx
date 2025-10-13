'use client'

import { useCallback, useMemo, useState } from 'react'

import { CommandSeparator } from 'cmdk'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { toast } from 'sonner'

import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  type PopoverContentProps,
  type PopoverProps,
  PopoverTrigger,
  type PopoverTriggerProps,
} from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface MultiSelectOption {
  icon?: React.ReactNode | string
  label: string
  value: string
}

export interface MultiSelectBadgeProps extends Omit<BadgeProps, 'children' | 'onSelect'> {
  disabled: boolean
  disabledMessage?: string
  item: string
  onSelect?: (item: string) => void
  options: MultiSelectOption[]
  removeLabel?:
    | {
        appendOption?: boolean
        text: string
      }
    | false
  tooltipDelay?: number
}

const MultiSelectBadge = ({
  className,
  disabled,
  disabledMessage,
  item,
  onSelect,
  options,
  removeLabel = {
    appendOption: true,
    text: 'Remove',
  },
  tooltipDelay = 500,
  ...props
}: MultiSelectBadgeProps) => {
  const { icon, label } = useMemo(() => options.find(({ value }) => value === item), [item, options]) ?? {}

  const title = useMemo(() => {
    if (disabled || !removeLabel) return
    if (!label) return removeLabel.text
    return `${removeLabel.text}${removeLabel.appendOption ? ` ${label}` : ''}`
  }, [disabled, label, removeLabel])

  const onClick = useCallback(() => {
    if (!onSelect) return
    if (disabled) return
    onSelect(item)
  }, [disabled, item, onSelect])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled || e.key !== 'Enter' || !onSelect) return
      onSelect(item)
    },
    [disabled, item, onSelect]
  )

  const badge = (
    <Badge
      asChild
      className={cn('group h-5.5 px-1.5 py-0', disabled ? 'cursor-not-allowed' : 'cursor-pointer', className)}
      key={item}
      onClick={onClick}
      onKeyDown={onKeyDown}
      size="xs"
      tabIndex={0}
      title={title}
      {...props}
    >
      <div className="flex items-center justify-between gap-0.5">
        {icon && <span className="text-base">{icon}</span>}
        <span
          className={cn(
            'translate-x-[3px] rounded-full p-[1.5px] transition-all',
            !disabled &&
              'group-hover:border-destructive-accent group-hover:bg-destructive/75 group-hover:text-destructive-foreground'
          )}
          role="button"
        >
          <X className={cn('size-2', !disabled && 'group-hover:stroke-white')} />
        </span>
      </div>
    </Badge>
  )

  if (!(disabled && disabledMessage)) return badge

  return (
    <Tooltip delayDuration={tooltipDelay} disableHoverableContent>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent align="center" arrow={false} className="text-[11px]" side="top">
        {disabledMessage}
      </TooltipContent>
    </Tooltip>
  )
}

export type MultiSelectProps = PopoverProps & {
  capitalize?: boolean
  contentProps?: PopoverContentProps
  disabled?: boolean
  enableSearch?: boolean
  enableSelectAll?: boolean
  isLoading?: boolean
  minItems?: {
    count?: number
    message?: string
    delay?: number
  }
  onChange: (selected: string[]) => void
  options: MultiSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  selectAllLabel?: string
  toastTimeout?: number
  toastType?: 'info' | 'success' | 'error' | 'warning'
  triggerProps?: PopoverTriggerProps
  value: string[]
}

export const MultiSelect = ({
  capitalize,
  className,
  contentProps,
  disabled = false,
  enableSearch = true,
  enableSelectAll = true,
  isLoading = false,
  minItems,
  onChange,
  options,
  placeholder,
  searchPlaceholder = 'Search items...',
  selectAllLabel = 'Select All',
  toastTimeout = 2_000,
  toastType = 'info',
  triggerProps,
  value,
  ...props
}: MultiSelectProps) => {
  const [open, setOpen] = useState(false)
  const [selectTime, setSelectTime] = useState<number | null>(null)

  const { className: contentClassName, ...contentRest } = contentProps || {}
  const { className: triggerClassName, ...triggerRest } = triggerProps || {}
  const { count = 0, delay, message } = minItems || {}

  const canUnselect = useMemo(() => value.length > count, [count, value.length])

  const isSelected = useCallback((item: string) => value.includes(item), [value])

  const openDropdown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(prev => !prev)
  }, [])

  const onUnselect = useCallback(
    (item: string) => {
      if (canUnselect) return onChange(value.filter(i => i !== item))
      if (selectTime && Date.now() - selectTime < toastTimeout) return

      toast[toastType](message, { duration: 200_000 })
      setSelectTime(Date.now())
    },
    [canUnselect, message, onChange, selectTime, toastTimeout, toastType, value]
  )

  const onSelect = useCallback(
    (item: string) => () => {
      if (value.includes(item)) return onUnselect(item)
      onChange([...value, item])
    },
    [onUnselect, onChange, value]
  )

  const onSelectAll = useCallback(() => {
    onChange(options.map(option => option.value))
  }, [onChange, options])

  const isAllSelected = useMemo(() => value.length === options.length, [options.length, value.length])

  const onButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  return (
    <div className={cn('w-full', className)}>
      <Popover onOpenChange={setOpen} open={open} {...props}>
        <PopoverTrigger
          aria-expanded={open}
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background text-sm transition-all disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          disabled={disabled}
          onClick={onButtonClick}
          {...triggerRest}
        >
          <div className="flex flex-1 justify-between overflow-hidden">
            <div
              className="flex flex-1 gap-1 overflow-x-auto px-3 py-2"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'hsl(var(--border)) transparent',
              }}
            >
              {value.length === 0 ? (
                <span className="truncate text-muted-foreground">{placeholder}</span>
              ) : (
                value.map(item => (
                  <MultiSelectBadge
                    disabled={!canUnselect}
                    disabledMessage={message}
                    item={item}
                    key={item}
                    onSelect={onSelect(item)}
                    options={options}
                    tooltipDelay={delay}
                  />
                ))
              )}
            </div>
            <hr className="mx-0.5 my-auto h-6 border-border border-l" />
            <span
              className={cn(
                'mx-1.5 my-auto h-full cursor-pointer rounded-sm p-1 outline-none hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                open && 'cursor-default bg-accent/50'
              )}
              onClick={openDropdown}
              role="button"
              tabIndex={0}
            >
              <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent align="end" className={cn('p-0', contentClassName)} {...contentRest}>
          <Command>
            {enableSearch && <CommandInput autoFocus placeholder={searchPlaceholder} />}
            <CommandList>
              <CommandEmpty className="p-0">
                {isLoading ? (
                  <div className="p-2">
                    {Array.from({ length: options.length }).map((_, i) => (
                      <Skeleton className="mb-1 h-4 w-full last:mb-0" key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-muted-foreground text-sm">{'No items found.'}</div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {options.map(option => (
                  <CommandItem
                    className={cn(
                      'group/item',
                      isSelected(option.value) && !canUnselect ? 'cursor-default' : 'cursor-pointer'
                    )}
                    key={option.value}
                    onSelect={onSelect(option.value)}
                    value={option.value}
                  >
                    <Check
                      className={cn(
                        'size-4',
                        isSelected(option.value) ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-30'
                      )}
                    />
                    <div className="flex items-center gap-1.5">
                      {option.icon && <span className="">{option.icon}</span>}
                      {option.label}
                    </div>
                  </CommandItem>
                ))}
                <CommandSeparator />
                {enableSelectAll && (
                  <CommandItem className="cursor-pointer" disabled={isAllSelected} onSelect={onSelectAll} value="all">
                    {selectAllLabel}
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
