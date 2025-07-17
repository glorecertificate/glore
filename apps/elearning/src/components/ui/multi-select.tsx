'use client'

import { useCallback, useMemo, useState } from 'react'

import { Check, ChevronsUpDown, X } from 'lucide-react'

import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  type PopoverContentProps,
  type PopoverProps,
  type PopoverTriggerProps,
} from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useLocale } from '@/hooks/use-locale'
import { useTranslations } from '@/hooks/use-translations'
import { cn } from '@/lib/utils'

export interface MultiSelectProps extends PopoverProps {
  contentProps?: PopoverContentProps
  disabled?: boolean
  isLoading?: boolean
  minItems?: {
    count?: number
    message?: string
    delay?: number
  }
  onChange: (selected: string[]) => void
  options: Array<{
    label: string
    value: string
    icon?: React.ReactNode | string
  }>
  placeholder?: string
  search?: boolean
  triggerProps?: PopoverTriggerProps
  value: string[]
}

const MultiSelectBadge = ({
  className,
  disabled,
  disabledMessage,
  item,
  onSelect,
  options,
  tooltipDelay = 500,
  ...props
}: BadgeProps & {
  disabled: boolean
  disabledMessage?: string
  item: string
  onSelect: (item: string) => void
  options: MultiSelectProps['options']
  tooltipDelay?: number
}) => {
  const { locale } = useLocale()
  const t = useTranslations()

  const option = useMemo(() => options.find(({ value }) => value === item), [item, options])
  const title = useMemo(
    () =>
      disabled ? undefined : `${t('Common.remove')} ${locale === 'en' ? option?.label : option?.label?.toLowerCase()}`,
    [disabled, locale, option?.label, t],
  )

  const badge = useMemo(
    () => (
      <Badge
        asChild
        className={cn('group px-1.5 py-0', disabled ? 'cursor-not-allowed' : 'cursor-pointer', className)}
        color="muted"
        key={item}
        onClick={onSelect.bind(null, item)}
        onKeyDown={e => e.key === 'Enter' && onSelect(item)}
        size="xs"
        tabIndex={0}
        title={title}
        {...props}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-sm">{option?.icon}</span>
          <span
            className={cn(
              'translate-x-[3px] rounded-full p-[1.5px] transition-all',
              !disabled &&
                'group-hover:border-destructive-accent group-hover:bg-destructive/75 group-hover:text-destructive-foreground',
            )}
            role="button"
          >
            <X className={cn('h-2 w-2', !disabled && 'group-hover:stroke-white')} />
          </span>
        </div>
      </Badge>
    ),
    [className, disabled, item, onSelect, option, props, title],
  )

  if (!disabled || !disabledMessage) return badge

  return (
    <Tooltip delayDuration={tooltipDelay} disableHoverableContent>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent align="center" arrow={false} className="text-[11px]" side="top">
        {disabledMessage}
      </TooltipContent>
    </Tooltip>
  )
}

export const MultiSelect = ({
  className,
  contentProps,
  disabled = false,
  isLoading = false,
  minItems,
  onChange,
  options,
  search = true,
  triggerProps,
  value,
  ...props
}: MultiSelectProps) => {
  const t = useTranslations('Common')
  const [open, setOpen] = useState(false)

  const placeholder = useMemo(() => props.placeholder ?? t('selectItems'), [props.placeholder, t])
  const { className: contentClassName, ...contentRest } = contentProps || {}
  const { className: triggerClassName, ...triggerRest } = triggerProps || {}
  const { count = 0, delay, message } = minItems || {}

  const canUnselect = useMemo(() => value.length > count, [count, value.length])

  const isSelected = useCallback((item: string) => value.includes(item), [value])

  const openDropdown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(prev => !prev)
  }, [])

  const handleUnselect = useCallback(
    (item: string) => {
      if (!canUnselect) return
      onChange(value.filter(i => i !== item))
    },
    [canUnselect, onChange, value],
  )

  const handleSelect = useCallback(
    (item: string) => () => {
      if (value.includes(item)) {
        handleUnselect(item)
        return
      }
      onChange([...value, item])
    },
    [handleUnselect, onChange, value],
  )

  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  return (
    <div className={cn('w-full', className)}>
      <Popover onOpenChange={setOpen} open={open} {...props}>
        <PopoverTrigger
          aria-expanded={open}
          className={cn(
            `
              flex h-9 w-full items-center justify-between rounded-md border border-input bg-background text-sm transition-all
              disabled:cursor-not-allowed disabled:opacity-50
            `,
            className,
          )}
          disabled={disabled}
          onClick={handleButtonClick}
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
                    onSelect={handleSelect(item)}
                    options={options}
                    tooltipDelay={delay}
                  />
                ))
              )}
            </div>
            <hr className="mx-0.5 my-auto h-6 border-l border-border" />
            <span
              className={cn(
                `
                  mx-1.5 my-auto h-full cursor-pointer rounded-sm p-1 outline-none
                  hover:bg-accent/50
                  focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                `,
                open && 'cursor-default bg-accent/50',
              )}
              onClick={openDropdown}
              role="button"
              tabIndex={0}
            >
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent align="end" className={cn('p-0', contentClassName)} {...contentRest}>
          <Command>
            {search && <CommandInput autoFocus placeholder={`${t('searchItems')}...`} />}
            <CommandList>
              <CommandEmpty className="p-0">
                {isLoading ? (
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
                {options.map(option => (
                  <CommandItem
                    className={cn(
                      'group/item',
                      isSelected(option.value) && !canUnselect ? 'cursor-default' : 'cursor-pointer',
                    )}
                    key={option.value}
                    onSelect={handleSelect(option.value)}
                    value={option.value}
                  >
                    <Check
                      className={cn(
                        'h-4 w-4',
                        isSelected(option.value) ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-30',
                      )}
                    />
                    <div className="flex items-center gap-1.5">
                      {option.icon && <span className="">{option.icon}</span>}
                      {option.label}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
