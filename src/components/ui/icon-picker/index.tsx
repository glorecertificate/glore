'use client'

import { memo, useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'

import { type VirtualItem, useVirtualizer } from '@tanstack/react-virtual'
import Fuse from 'fuse.js'
import { type IconName, dynamicIconImports } from 'lucide-react/dynamic'
import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useDebounce } from '@/hooks/use-debounce'
import { useMounted } from '@/hooks/use-mounted'
import { type Any } from '@/lib/types'
import { cn } from '@/lib/utils'

interface IconData {
  name: string
  categories: string[]
  tags: string[]
}

export interface IconPickerProps extends ButtonProps {
  categorized?: boolean
  defaultOpen?: boolean
  defaultValue?: IconName
  fallback?: React.ReactNode
  iconsList?: IconData[]
  modal?: boolean
  onOpenChange?: (open: boolean) => void
  onValueChange?: (value: IconName) => void
  open?: boolean
  searchable?: boolean
  showLabels?: boolean
  tooltips?: boolean
  value?: IconName
}

const IconRenderer = memo(({ name }: { name: IconName }) => <LucideIcon name={name} />)

const IconsColumnSkeleton = () => (
  <div className="mt-1 flex w-full flex-col gap-2">
    <div className="grid w-full grid-cols-5 gap-2">
      {Array.from({ length: 40 }).map((_, i) => (
        <Skeleton className="h-10 w-10 rounded-md" key={i} />
      ))}
    </div>
  </div>
)

let cachedIcons: IconData[] | null = null

const loadIconData = async () => {
  if (cachedIcons) return cachedIcons
  const { default: icons } = await import('./data')
  cachedIcons = icons.filter((icon: IconData) => icon.name in dynamicIconImports)
  return cachedIcons
}

export const useIconData = () => {
  const mounted = useMounted()
  const [icons, setIcons] = useState<IconData[]>(cachedIcons ?? [])
  const [isLoading, setIsLoading] = useState(!cachedIcons)

  const loadIcons = useEffectEvent(async () => {
    if (cachedIcons) {
      setIcons(cachedIcons)
      setIsLoading(false)
      return
    }
    if (mounted) {
      const data = await loadIconData()
      setIcons(data)
      setIsLoading(false)
    }
  })

  useEffect(() => void loadIcons(), [])

  return { icons, isLoading }
}

export const IconPicker = memo(
  ({
    categorized = true,
    children,
    className,
    defaultOpen,
    defaultValue,
    fallback,
    iconsList,
    modal = false,
    onOpenChange,
    onValueChange,
    open,
    searchable = true,
    showLabels,
    tooltips,
    value,
    ...props
  }: IconPickerProps) => {
    const t = useTranslations('Components.IconPicker')
    const { icons } = useIconData()

    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 100)
    const [selectedIcon, setSelectedIcon] = useState<IconName | undefined>(defaultValue)
    const [isOpen, setIsOpen] = useState(defaultOpen)
    const [isPopoverVisible, setIsPopoverVisible] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const iconsToUse = useMemo(() => iconsList || icons, [iconsList, icons])

    const fuseInstance = useMemo(
      () =>
        new Fuse(iconsToUse, {
          ignoreLocation: true,
          includeScore: true,
          keys: ['name', 'tags', 'categories'],
          threshold: 0.3,
        }),
      [iconsToUse]
    )

    const filteredIcons = useMemo(() => {
      if (debouncedSearch.trim() === '') {
        return iconsToUse
      }

      const results = fuseInstance.search(debouncedSearch.toLowerCase().trim())
      return results.map(result => result.item)
    }, [debouncedSearch, iconsToUse, fuseInstance])

    const categorizedIcons = useMemo(() => {
      if (!categorized || debouncedSearch.trim() !== '') {
        return [{ icons: filteredIcons, name: 'All Icons' }]
      }

      const categories = new Map<string, IconData[]>()

      for (const icon of filteredIcons) {
        if (icon.categories && icon.categories.length > 0) {
          for (const category of icon.categories) {
            if (!categories.has(category)) {
              categories.set(category, [])
            }
            categories.get(category)!.push(icon)
          }
          continue
        }
        const category = 'Other'
        if (!categories.has(category)) {
          categories.set(category, [])
        }
        categories.get(category)!.push(icon)
      }

      return Array.from(categories.entries())
        .map(([name, icons]) => ({ icons, name: t(`categories.${name}` as Any) }))
        .sort((a, b) => a.name.localeCompare(b.name))
    }, [filteredIcons, categorized, debouncedSearch, t])

    const virtualItems = useMemo(() => {
      const items: Array<{
        type: 'category' | 'row'
        categoryIndex: number
        rowIndex?: number
        icons?: IconData[]
      }> = []

      for (const [categoryIndex, category] of categorizedIcons.entries()) {
        if (categorized) {
          items.push({ categoryIndex, type: 'category' })
        }

        const rows = []
        for (let i = 0; i < category.icons.length; i += 5) {
          rows.push(category.icons.slice(i, i + 5))
        }

        for (const [rowIndex, rowIcons] of rows.entries()) {
          items.push({
            categoryIndex,
            icons: rowIcons,
            rowIndex,
            type: 'row',
          })
        }
      }

      return items
    }, [categorizedIcons, categorized])

    const categoryIndices = useMemo(() => {
      const indices: Record<string, number> = {}

      for (const [index, item] of virtualItems.entries()) {
        if (item.type === 'category') {
          indices[categorizedIcons[item.categoryIndex].name] = index
        }
      }

      return indices
    }, [virtualItems, categorizedIcons])

    const parentRef = useRef<HTMLDivElement>(null)

    const virtualizer = useVirtualizer({
      count: virtualItems.length,
      estimateSize: index => (virtualItems[index].type === 'category' ? 25 : 40),
      gap: 10,
      getScrollElement: () => parentRef.current,
      overscan: 5,
      paddingEnd: 2,
    })

    const virtualizerStyle = useMemo(
      () => ({
        height: `${virtualizer.getTotalSize()}px`,
      }),
      [virtualizer]
    )

    const listStyle = useMemo<React.CSSProperties>(
      () => ({
        scrollbarColor: 'var(--color-brand)',
        scrollbarWidth: 'thin',
      }),
      []
    )

    const getVirtualItemStyle = useCallback(
      (virtualItem: VirtualItem) => ({
        height: `${virtualItem.size}px`,
        left: 0,
        position: 'absolute' as const,
        top: 0,
        transform: `translateY(${virtualItem.start}px)`,
        width: '100%',
      }),
      []
    )

    const handleValueChange = useCallback(
      (icon: IconName) => {
        if (value === undefined) {
          setSelectedIcon(icon)
        }
        onValueChange?.(icon)
      },
      [value, onValueChange]
    )

    const handleOpenChange = useCallback(
      (newOpen: boolean) => {
        setSearch('')
        if (open === undefined) {
          setIsOpen(newOpen)
        }
        onOpenChange?.(newOpen)

        setIsPopoverVisible(newOpen)

        if (newOpen) {
          setTimeout(() => {
            virtualizer.measure()
            setIsLoading(false)
          }, 1)
        }
      },
      [open, onOpenChange, virtualizer]
    )

    const handleIconClick = useCallback(
      (iconName: string) => () => {
        handleValueChange(iconName as IconName)
        setIsOpen(false)
        setSearch('')
      },
      [handleValueChange]
    )

    const handleSearchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value)

        if (parentRef.current) {
          parentRef.current.scrollTop = 0
        }

        virtualizer.scrollToOffset(0)
      },
      [virtualizer]
    )

    const scrollToCategory = useCallback(
      (categoryName: string) => {
        const categoryIndex = categoryIndices[categoryName]

        if (categoryIndex !== undefined && virtualizer) {
          virtualizer.scrollToIndex(categoryIndex, {
            align: 'start',
            behavior: 'smooth',
          })
        }
      },
      [categoryIndices, virtualizer]
    )

    const handleCategoryClick = useCallback(
      (categoryName: string) => (e: React.MouseEvent) => {
        e.stopPropagation()
        scrollToCategory(categoryName)
      },
      [scrollToCategory]
    )

    const handleClose = useCallback((e: Event) => e.preventDefault(), [])

    const categoryButtons = useMemo(() => {
      if (!categorized || debouncedSearch.trim() !== '') {
        return null
      }

      return categorizedIcons.map(category => (
        <Button
          className="text-xs"
          key={category.name}
          onClick={handleCategoryClick(category.name)}
          size="sm"
          variant="outline"
        >
          {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
        </Button>
      ))
    }, [categorized, categorizedIcons, debouncedSearch, handleCategoryClick])

    const renderIcon = useCallback(
      (icon: IconData) => {
        if (!tooltips) {
          return (
            <Button key={icon.name} onClick={handleIconClick(icon.name)} variant="outline">
              <IconRenderer name={icon.name as IconName} />
            </Button>
          )
        }

        return (
          <TooltipProvider key={icon.name}>
            <Tooltip>
              <TooltipTrigger
                className="flex items-center justify-center rounded-md border p-2 transition hover:bg-foreground/10"
                onClick={handleIconClick(icon.name)}
              >
                <IconRenderer name={icon.name as IconName} />
              </TooltipTrigger>
              <TooltipContent>{icon.name}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
      [handleIconClick, tooltips]
    )

    const renderVirtualContent = useCallback(() => {
      if (filteredIcons.length === 0) {
        return <p className="pt-1 text-sm text-muted-foreground">{t('noIconsFound')}</p>
      }

      return (
        <div className="relative w-full overscroll-contain" style={virtualizerStyle}>
          {virtualizer.getVirtualItems().map((virtualItem: VirtualItem) => {
            const item = virtualItems[virtualItem.index]
            if (!item) return null
            const itemStyle = getVirtualItemStyle(virtualItem)

            if (item.type === 'row') {
              return (
                <div data-index={virtualItem.index} key={virtualItem.key} style={itemStyle}>
                  <div className="grid w-full grid-cols-5 gap-2">{item.icons!.map(renderIcon)}</div>
                </div>
              )
            }

            if (categorized) {
              return (
                <div className="top-0 z-10" key={virtualItem.key} style={itemStyle}>
                  <h3 className="text-sm font-medium capitalize">{categorizedIcons[item.categoryIndex].name}</h3>
                  <Separator className="my-1.5" />
                </div>
              )
            }

            return null
          })}
        </div>
      )
    }, [
      categorized,
      categorizedIcons,
      filteredIcons.length,
      getVirtualItemStyle,
      renderIcon,
      t,
      virtualItems,
      virtualizerStyle,
      virtualizer,
    ])

    useEffect(() => {
      if (isPopoverVisible) {
        setIsLoading(true)
        const timer = setTimeout(() => {
          setIsLoading(false)
          virtualizer.measure()
        }, 10)

        const resizeObserver = new ResizeObserver(() => {
          virtualizer.measure()
        })

        if (parentRef.current) {
          resizeObserver.observe(parentRef.current)
        }

        return () => {
          clearTimeout(timer)
          resizeObserver.disconnect()
        }
      }
    }, [isPopoverVisible, virtualizer])

    const iconName = (value || selectedIcon) as IconName

    return (
      <Popover modal={modal} onOpenChange={handleOpenChange} open={open ?? isOpen}>
        <PopoverTrigger asChild>
          {children ?? (
            <Button
              className={cn('has-[>svg]:animate-none', isOpen && 'cursor-default', className)}
              variant="ghost"
              {...props}
            >
              {iconName && (
                <>
                  <LucideIcon className={cn(isOpen && 'text-foreground')} fallback={fallback} name={iconName} />
                  {showLabels && t('updateIcon')}
                </>
              )}
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-64 rounded-lg border bg-card p-3" onCloseAutoFocus={handleClose}>
          {searchable && (
            <Input
              className="mb-2 rounded-lg"
              onChange={handleSearchChange}
              placeholder={t('searchIcons')}
              value={search}
            />
          )}
          {categorized && debouncedSearch.trim() === '' && (
            <div className="mt-2 scrollbar-hide flex flex-row gap-1 overflow-x-auto pb-2">{categoryButtons}</div>
          )}
          <div className="max-h-60 overflow-auto" ref={parentRef} style={listStyle}>
            {isLoading ? <IconsColumnSkeleton /> : renderVirtualContent()}
          </div>
        </PopoverContent>
      </Popover>
    )
  }
)
