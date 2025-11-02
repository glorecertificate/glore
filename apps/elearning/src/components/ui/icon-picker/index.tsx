'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual'
import Fuse from 'fuse.js'
import { DynamicIcon, dynamicIconImports, type IconName } from 'lucide-react/dynamic'
import { useTranslations } from 'next-intl'
import { useDebounceValue } from 'usehooks-ts'

import { type Any } from '@glore/utils/types'

import { Button, type ButtonProps } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { type iconsData } from './data'

export type IconData = (typeof iconsData)[number]

export interface IconPickerProps extends ButtonProps {
  categorized?: boolean
  defaultOpen?: boolean
  defaultValue?: IconName
  iconsList?: IconData[]
  labels?: boolean
  modal?: boolean
  onOpenChange?: (open: boolean) => void
  onValueChange?: (value: IconName) => void
  open?: boolean
  searchable?: boolean
  tooltips?: boolean
  value?: IconName
}

const IconRenderer = memo(({ name }: { name: IconName }) => <DynamicIcon name={name} />)

const IconsColumnSkeleton = () => (
  <div className="flex w-full flex-col gap-2">
    <Skeleton className="h-4 w-1/2 rounded-md" />
    <div className="grid w-full grid-cols-5 gap-2">
      {Array.from({ length: 40 }).map((_, i) => (
        <Skeleton className="h-10 w-10 rounded-md" key={i} />
      ))}
    </div>
  </div>
)

export const useIconsData = () => {
  const [icons, setIcons] = useState<IconData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const loadIcons = async () => {
      setIsLoading(true)
      const { iconsData } = await import('./data')
      if (isMounted) {
        setIcons(iconsData.filter((icon: IconData) => icon.name in dynamicIconImports))
        setIsLoading(false)
      }
    }
    loadIcons()
    return () => {
      isMounted = false
    }
  }, [])
  return { icons, isLoading }
}

export const IconPicker = ({
  categorized = true,
  children,
  className,
  defaultOpen,
  defaultValue,
  iconsList,
  labels,
  loading,
  modal = false,
  onOpenChange,
  onValueChange,
  open,
  searchable = true,
  tooltips,
  value,
  ...props
}: IconPickerProps) => {
  const t = useTranslations('Icons')
  const { icons } = useIconsData()

  const [search, setSearch] = useDebounceValue('', 100)
  const [selectedIcon, setSelectedIcon] = useState<IconName | undefined>(defaultValue)
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isPopoverVisible, setIsPopoverVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const iconsToUse = useMemo(() => iconsList || icons, [iconsList, icons])

  const fuseInstance = useMemo(
    () =>
      new Fuse(iconsToUse, {
        keys: ['name', 'tags', 'categories'],
        threshold: 0.3,
        ignoreLocation: true,
        includeScore: true,
      }),
    [iconsToUse]
  )

  const filteredIcons = useMemo(() => {
    if (search.trim() === '') {
      return iconsToUse
    }

    const results = fuseInstance.search(search.toLowerCase().trim())
    return results.map(result => result.item)
  }, [search, iconsToUse, fuseInstance])

  const categorizedIcons = useMemo(() => {
    if (!categorized || search.trim() !== '') {
      return [{ name: 'All Icons', icons: filteredIcons }]
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
      .map(([name, icons]) => ({ name: t(`categories.${name}` as Any), icons }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [filteredIcons, categorized, search, t])

  const virtualItems = useMemo(() => {
    const items: Array<{
      type: 'category' | 'row'
      categoryIndex: number
      rowIndex?: number
      icons?: IconData[]
    }> = []

    for (const [categoryIndex, category] of categorizedIcons.entries()) {
      items.push({ type: 'category', categoryIndex })

      const rows = []
      for (let i = 0; i < category.icons.length; i += 5) {
        rows.push(category.icons.slice(i, i + 5))
      }

      for (const [rowIndex, rowIcons] of rows.entries()) {
        items.push({
          type: 'row',
          categoryIndex,
          rowIndex,
          icons: rowIcons,
        })
      }
    }

    return items
  }, [categorizedIcons])

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
    getScrollElement: () => parentRef.current,
    estimateSize: index => (virtualItems[index].type === 'category' ? 25 : 40),
    paddingEnd: 2,
    gap: 10,
    overscan: 5,
  })

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
    [open, onOpenChange, setSearch, virtualizer]
  )

  const handleIconClick = useCallback(
    (iconName: IconName) => {
      handleValueChange(iconName)
      setIsOpen(false)
      setSearch('')
    },
    [handleValueChange, setSearch]
  )

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value)

      if (parentRef.current) {
        parentRef.current.scrollTop = 0
      }

      virtualizer.scrollToOffset(0)
    },
    [setSearch, virtualizer]
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

  const categoryButtons = useMemo(() => {
    if (!categorized || search.trim() !== '') return null

    return categorizedIcons.map(category => (
      <Button
        className="text-xs"
        key={category.name}
        onClick={e => {
          e.stopPropagation()
          scrollToCategory(category.name)
        }}
        size="sm"
        variant={'outline'}
      >
        {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
      </Button>
    ))
  }, [categorizedIcons, scrollToCategory, categorized, search])

  const renderIcon = useCallback(
    (icon: IconData) => {
      if (!tooltips) {
        return (
          <Button key={icon.name} onClick={() => handleIconClick(icon.name as IconName)} variant="outline">
            <IconRenderer name={icon.name as IconName} />
          </Button>
        )
      }

      return (
        <TooltipProvider key={icon.name}>
          <Tooltip>
            <TooltipTrigger
              className="flex items-center justify-center rounded-md border p-2 transition hover:bg-foreground/10"
              onClick={() => handleIconClick(icon.name as IconName)}
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
      return <div className="text-center text-gray-500">No icon found</div>
    }

    return (
      <div
        className="relative w-full overscroll-contain"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem: VirtualItem) => {
          const item = virtualItems[virtualItem.index]

          if (!item) return null

          const itemStyle = {
            position: 'absolute' as const,
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualItem.size}px`,
            transform: `translateY(${virtualItem.start}px)`,
          }

          if (item.type === 'category') {
            return (
              <div className="top-0 z-10" key={virtualItem.key} style={itemStyle}>
                <h3 className="font-medium text-sm capitalize">{categorizedIcons[item.categoryIndex].name}</h3>
                <Separator className="my-1.5" />
              </div>
            )
          }

          return (
            <div data-index={virtualItem.index} key={virtualItem.key} style={itemStyle}>
              <div className="grid w-full grid-cols-5 gap-2">{item.icons!.map(renderIcon)}</div>
            </div>
          )
        })}
      </div>
    )
  }, [virtualizer, virtualItems, categorizedIcons, filteredIcons, renderIcon])

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
            className={cn(
              'bg-muted/50 transition-colors hover:bg-muted! hover:text-accent-foreground has-[>svg]:animate-none data-[state=open]:cursor-default! data-[state=open]:bg-muted!',
              (loading || iconName) && 'animate-pulse',
              className
            )}
            variant="ghost"
            {...props}
          >
            {iconName && (
              <>
                <DynamicIcon name={iconName} />
                {labels && t('updateIcon')}
              </>
            )}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-64 rounded-lg border bg-popover p-3">
        {searchable && (
          <Input className="mb-2" onChange={handleSearchChange} placeholder={t('searchIcons')} value={search} />
        )}
        {categorized && search.trim() === '' && (
          <div className="scrollbar-hide mt-2 flex flex-row gap-1 overflow-x-auto pb-2">{categoryButtons}</div>
        )}
        <div className="max-h-60 overflow-auto" ref={parentRef} style={{ scrollbarWidth: 'thin' }}>
          {isLoading ? <IconsColumnSkeleton /> : renderVirtualContent()}
        </div>
      </PopoverContent>
    </Popover>
  )
}
