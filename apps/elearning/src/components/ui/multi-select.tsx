'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

import { CommandSeparator } from 'cmdk'
import { CheckIcon, ChevronsUpDownIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { Badge, type BadgeProps } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  type CommandItemProps,
  CommandList,
} from '@/components/ui/command'
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

interface MultiSelectContext {
  disabled: boolean
  loading: boolean
  open: boolean
  options: string[]
  resetOptions: () => void
  selectOption: (option: string) => void
  setOpen: (open: boolean) => void
  validation: {
    count: number
    message: string
    delay: number
  }
  value: string[]
}

const MultiSelectContext = createContext<MultiSelectContext | null>(null)

const useMultiSelect = () => {
  const context = useContext(MultiSelectContext)
  if (!context) throw new Error('useMultiSelect must be used within a MultiSelectProvider')
  return context
}

export interface MultiSelectProps extends PopoverProps {
  disabled?: boolean
  entity?: string
  loading?: boolean
  options: string[]
  onValueChange: (selected: string[]) => void
  validation?: {
    count?: number
    message?: string
    delay?: number
  }
  value: string[]
}

export const MultiSelect = ({
  children,
  disabled,
  entity,
  loading,
  onValueChange,
  options,
  validation: validate,
  value,
  ...props
}: MultiSelectProps) => {
  const t = useTranslations('Common')

  const [open, setOpen] = useState(false)
  const [selectTime, setSelectTime] = useState<number | null>(null)

  const validation = { count: 1, message: t('selectAtLeastOneItem'), delay: 500, ...validate }

  const unselectOption = useCallback(
    (option: string) => {
      if (value.length > validation.count) return onValueChange(value.filter(v => v !== option))
      if (selectTime && Date.now() - selectTime < 2000) return
      toast.info(validation.message)
      setSelectTime(Date.now())
    },
    [onValueChange, selectTime, validation.count, validation.message, value.length, value.filter]
  )

  const selectOption = useCallback(
    (option: string) => {
      if (value.includes(option)) return unselectOption(option)
      const selected = options.find(o => o === option)
      if (!selected) return
      onValueChange([...value, selected])
    },
    [onValueChange, options, unselectOption, value]
  )

  const resetOptions = useCallback(() => {
    onValueChange(options)
  }, [options, onValueChange])

  return (
    <MultiSelectContext.Provider
      value={{
        disabled: !!disabled,
        loading: !!loading,
        open,
        options,
        resetOptions,
        selectOption,
        setOpen,
        validation,
        value,
      }}
    >
      <Popover onOpenChange={setOpen} open={open} {...props}>
        {children}
      </Popover>
    </MultiSelectContext.Provider>
  )
}

export interface MultiSelectBadgeProps extends BadgeProps {
  disabled?: boolean
  disabledMessage?: string
  label?: string
  tooltipDelay?: number
  value: string
}

export const MultiSelectBadge = ({
  children,
  className,
  disabled: badgeDisabled,
  disabledMessage,
  label,
  tooltipDelay = 500,
  value,
  ...props
}: MultiSelectBadgeProps) => {
  const t = useTranslations('Common')
  const { disabled: rootDisabled, selectOption } = useMultiSelect()
  const disabled = rootDisabled || badgeDisabled

  const title = useMemo(() => {
    if (disabled) return
    if (!label) return t('removeItem')
    return `${t('remove')} ${label}`
  }, [disabled, label, t])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled || e.key !== 'Enter') return
      selectOption(value)
    },
    [disabled, selectOption, value]
  )

  const badge = (
    <Badge
      asChild
      className={cn(
        'group/multi-select-badge gap-0.5 px-2',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        className
      )}
      onClick={() => selectOption(value)}
      onKeyDown={onKeyDown}
      tabIndex={0}
      title={title}
      {...props}
    >
      <span>
        {children ?? label}
        <span
          className={cn(
            'translate-x-[3px] rounded-full p-[1.5px] transition-all',
            !disabled &&
              'group-hover/multi-select-badge:border-destructive-accent group-hover/multi-select-badge:bg-destructive/75 group-hover/multi-select-badge:text-destructive-foreground'
          )}
          role="button"
        >
          <XIcon className={cn('size-2', !disabled && 'group-hover/multi-select-badge:stroke-white')} />
        </span>
      </span>
    </Badge>
  )

  if (!(disabled && disabledMessage)) return badge

  return (
    <Tooltip delayDuration={tooltipDelay} disableHoverableContent>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent align="center" className="text-[11px]" side="top">
        {disabledMessage}
      </TooltipContent>
    </Tooltip>
  )
}

export interface MultiSelectItemProps extends CommandItemProps {
  label?: string
  value: string
}

export const MultiSelectItem = ({ children, className, label, value, ...props }: MultiSelectItemProps) => {
  const { selectOption, validation, value: rootValue } = useMultiSelect()
  const selected = rootValue.includes(value)

  return (
    <CommandItem
      className={cn(
        'group/item w-full pr-6',
        selected ? (rootValue.length === validation.count ? 'cursor-not-allowed' : 'cursor-default') : 'cursor-pointer'
      )}
      onSelect={() => selectOption(value)}
      value={value}
      {...props}
    >
      <CheckIcon className={cn('size-4', selected ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-30')} />
      <div className="flex items-center gap-1.5">{children ?? label}</div>
    </CommandItem>
  )
}

export interface MultiSelectTriggerProps extends PopoverTriggerProps {
  placeholder?: React.ReactNode
}

export const MultiSelectTrigger = ({
  children,
  disabled: triggerDisabled,
  className,
  onClick,
  placeholder,
  ...props
}: MultiSelectTriggerProps) => {
  const { disabled: rootDisabled, open, setOpen, value } = useMultiSelect()
  const disabled = rootDisabled || triggerDisabled

  const openDropdown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setOpen(!open)
    },
    [open, setOpen]
  )

  const onTriggerClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (disabled) return
      onClick?.(e)
    },
    [disabled, onClick]
  )

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
      <div className="flex flex-1 justify-between overflow-hidden">
        <div
          className="flex flex-1 gap-1 overflow-x-auto px-3 py-2"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'hsl(var(--border)) transparent',
          }}
        >
          {value.length === 0 ? <span className="truncate text-muted-foreground">{placeholder}</span> : children}
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
          <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
        </span>
      </div>
    </PopoverTrigger>
  )
}

export interface MultiSelectContentProps extends PopoverContentProps {
  enableSearch?: boolean
  /** @default true */
  enableSelectAll?: boolean
  searchPlaceholder?: string
  selectAllLabel?: string
}

export const MultiSelectContent = ({
  children,
  className,
  enableSearch,
  enableSelectAll = true,
  searchPlaceholder,
  selectAllLabel,
  ...props
}: MultiSelectContentProps) => {
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
              <div className="py-4 text-center text-muted-foreground text-sm">{'No items found.'}</div>
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
