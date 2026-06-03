'use client'

import { useEffect, useEffectEvent, useRef, useState } from 'react'

import { type VirtualItem, useVirtualizer } from '@tanstack/react-virtual'
import { type default as Fuse } from 'fuse.js'
import { type IconName } from 'lucide-react/dynamic'
import { useLocale, useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useDebounce } from '@/hooks/use-debounce'
import { type Any } from '@/lib/types'
import { cn } from '@/lib/utils'

type IconData = (typeof import('~/config/icons.json'))[number]

let cachedIcons: IconData[]

const loadIconData = async () => {
  if (cachedIcons) return cachedIcons
  const [{ default: icons }, { dynamicIconImports }] = await Promise.all([
    import('~/config/icons.json'),
    import('lucide-react/dynamic'),
  ])
  return (cachedIcons = (icons as IconData[]).filter(icon => icon.name in dynamicIconImports))
}

export const useIconData = () => {
  const [icons, setIcons] = useState<IconData[]>(cachedIcons ?? [])
  const [loading, setLoading] = useState(!cachedIcons)

  const loadIcons = useEffectEvent(async () => {
    const data = await loadIconData()
    setIcons(data)
    setLoading(false)
  })

  useEffect(() => void loadIcons(), [])

  return { icons, loading }
}

const IconsColumnSkeleton = () => (
  <div className="mt-1 flex w-full flex-col gap-2">
    <div className="grid w-full grid-cols-6 gap-2">
      {Array.from({ length: 42 }).map((_, i) => (
        <Skeleton className="aspect-square w-full rounded-md" key={i} />
      ))}
    </div>
  </div>
)

const IconRenderer = ({ name }: { name: IconName }) => <LucideIcon name={name} />

export const IconPicker = ({
  categorized = true,
  children,
  className,
  defaultOpen,
  defaultValue,
  fallback,
  modal = true,
  onOpenChange,
  onValueChange,
  open,
  searchable = true,
  showLabels,
  tooltips,
  value,
  ...props
}: Omit<ButtonProps, 'value'> & {
  categorized?: boolean
  defaultOpen?: boolean
  defaultValue?: IconName
  fallback?: React.ReactNode
  modal?: boolean
  onOpenChange?: (open: boolean) => void
  onValueChange?: (value: IconName) => void
  open?: boolean
  searchable?: boolean
  showLabels?: boolean
  tooltips?: boolean
  value?: IconName
}) => {
  const t = useTranslations('Components.IconPicker')
  const locale = useLocale()
  const { icons, loading: iconsLoading } = useIconData()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 100)
  const [selectedIcon, setSelectedIcon] = useState<IconName | undefined>(defaultValue)
  const [openState, setIsOpen] = useState(defaultOpen)
  const [loading, setLoading] = useState(true)
  const fuseRef = useRef<typeof Fuse | null>(null)

  const loadFuse = useEffectEvent(async () => {
    const { default: Fuse } = await import('fuse.js')
    fuseRef.current = Fuse
  })

  useEffect(() => void loadFuse(), [])

  const searchableIcons = icons.map(icon => ({
    ...icon,
    searchLabel: icon.label[locale] ?? icon.label.en,
    searchTags: icon.tags[locale] ?? icon.tags.en,
    categoryLabels: icon.categories.map(category => t(`categories.${category}` as Any)),
  }))

  const fuse = fuseRef.current
    ? new fuseRef.current(searchableIcons, {
        ignoreLocation: true,
        includeScore: true,
        keys: ['name', 'searchLabel', 'searchTags', 'categoryLabels'],
        threshold: 0.3,
      })
    : null

  const filteredIcons = (() => {
    if (debouncedSearch.trim() === '' || !fuse) return icons
    return fuse.search(debouncedSearch.toLowerCase().trim()).map(result => result.item)
  })()

  const categorizedIcons = (() => {
    if (!categorized || debouncedSearch.trim() !== '') {
      return [{ id: 'all', icons: filteredIcons, name: '' }]
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
      .map(([name, categoryIcons]) => ({ id: name, icons: categoryIcons, name: t(`categories.${name}` as Any) }))
      .sort((a, b) => a.name.localeCompare(b.name))
  })()

  const virtualItems = (() => {
    const items: Array<{
      type: 'category' | 'row'
      categoryIndex: number
      rowIndex?: number
      icons?: IconData[]
    }> = []

    for (const [categoryIndex, category] of categorizedIcons.entries()) {
      if (categorized) items.push({ categoryIndex, type: 'category' })

      const rows = []
      for (let i = 0; i < category.icons.length; i += 6) {
        rows.push(category.icons.slice(i, i + 6))
      }

      for (const [rowIndex, rowIcons] of rows.entries()) {
        items.push({ categoryIndex, icons: rowIcons, rowIndex, type: 'row' })
      }
    }

    return items
  })()

  const categoryIndices = (() => {
    const indices: Record<string, number> = {}

    for (const [index, item] of virtualItems.entries()) {
      if (item.type === 'category') {
        indices[categorizedIcons[item.categoryIndex].name] = index
      }
    }

    return indices
  })()

  const parentRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const resizeObserverRef = useRef<ResizeObserver>(undefined)

  const virtualizer = useVirtualizer({
    count: virtualItems.length,
    estimateSize: index => (virtualItems[index].type === 'category' ? 25 : 40),
    gap: 10,
    getScrollElement: () => parentRef.current,
    overscan: 5,
    paddingEnd: 2,
  })

  const getVirtualItemStyle = (virtualItem: VirtualItem) => ({
    height: `${virtualItem.size}px`,
    left: 0,
    position: 'absolute' as const,
    top: 0,
    transform: `translateY(${virtualItem.start}px)`,
    width: '100%',
  })

  const handleValueChange = (icon: IconName) => {
    if (value === undefined) setSelectedIcon(icon)
    onValueChange?.(icon)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setSearch('')
    if (open === undefined) setIsOpen(newOpen)
    onOpenChange?.(newOpen)

    if (!newOpen) {
      clearTimeout(timerRef.current)
      resizeObserverRef.current?.disconnect()
      setTimeout(() => {
        if (parentRef.current) parentRef.current.scrollTop = 0
        virtualizer.scrollToOffset(0)
      }, 200)
      return
    }

    setLoading(true)
    timerRef.current = setTimeout(() => {
      setLoading(false)
      virtualizer.measure()
    }, 10)
    resizeObserverRef.current = new ResizeObserver(() => {
      virtualizer.measure()
    })
    if (parentRef.current) {
      resizeObserverRef.current.observe(parentRef.current)
    }
  }

  const handleIconClick = (iconName: string) => () => {
    handleValueChange(iconName as IconName)
    setIsOpen(false)
    setSearch('')
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    if (parentRef.current) parentRef.current.scrollTop = 0
    virtualizer.scrollToOffset(0)
  }

  const scrollToCategory = (categoryName: string) => {
    const categoryIndex = categoryIndices[categoryName]

    if (categoryIndex !== undefined && virtualizer) {
      virtualizer.scrollToIndex(categoryIndex, {
        align: 'start',
        behavior: 'smooth',
      })
    }
  }

  const renderIcon = (icon: IconData) => {
    if (!tooltips) {
      return (
        <Button
          className="aspect-square w-full"
          key={icon.name}
          onClick={handleIconClick(icon.name)}
          variant="ghost"
          title={icon.label[locale] ?? icon.label.en}
        >
          <IconRenderer name={icon.name as IconName} />
        </Button>
      )
    }

    return (
      <TooltipProvider key={icon.name}>
        <Tooltip>
          <TooltipTrigger
            className="flex aspect-square w-full items-center justify-center rounded-md border p-2 transition hover:bg-foreground/10"
            onClick={handleIconClick(icon.name)}
          >
            <IconRenderer name={icon.name as IconName} />
          </TooltipTrigger>
          <TooltipContent>{icon.label[locale] ?? icon.label.en}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const renderVirtualContent = () => {
    if (filteredIcons.length === 0) {
      return <p className="pt-4 text-center text-sm text-muted-foreground">{t('noIconsFound')}</p>
    }

    return (
      <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem: VirtualItem) => {
          const item = virtualItems[virtualItem.index]
          if (!item) return null
          const itemStyle = getVirtualItemStyle(virtualItem)

          if (item.type === 'row') {
            return (
              <div data-index={virtualItem.index} key={virtualItem.key} style={itemStyle}>
                <div className="grid w-full grid-cols-6 gap-2">{item.icons!.map(renderIcon)}</div>
              </div>
            )
          }

          if (categorized) {
            return (
              <div className="top-0 z-10" key={virtualItem.key} style={itemStyle}>
                <h3 className="text-[13px] font-medium">{categorizedIcons[item.categoryIndex].name}</h3>
                <Separator className="my-1.5" />
              </div>
            )
          }

          return null
        })}
      </div>
    )
  }

  const iconName = value ?? selectedIcon

  return (
    <Popover modal={modal} onOpenChange={handleOpenChange} open={open ?? openState}>
      <PopoverTrigger asChild>
        {children ?? (
          <Button
            className={cn(
              'has-[>svg]:animate-none',
              openState && 'cursor-default bg-accent/80 dark:bg-accent/50',
              className
            )}
            variant="ghost"
            {...props}
          >
            {iconName && (
              <>
                <LucideIcon className={cn(openState && 'text-foreground')} fallback={fallback} name={iconName} />
                {showLabels && t('updateIcon')}
              </>
            )}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="flex w-72 flex-col gap-3 rounded-lg border bg-card p-3 shadow-xs"
        onCloseAutoFocus={e => e.preventDefault()}
      >
        {searchable && (
          <Input type="search" onChange={handleSearchChange} placeholder={t('searchIcons')} value={search} />
        )}
        {categorized && debouncedSearch.trim() === '' && (
          <div className="scrollbar-hide flex flex-row gap-1 overflow-x-auto">
            {categorized &&
              debouncedSearch.trim() === '' &&
              categorizedIcons.map(category => (
                <Button
                  key={category.id}
                  onClick={e => {
                    e.stopPropagation()
                    scrollToCategory(category.name)
                  }}
                  size="xs"
                  variant="outline"
                >
                  {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                </Button>
              ))}
          </div>
        )}
        <div
          className="h-60 overflow-y-auto overscroll-contain"
          ref={parentRef}
          style={{
            scrollbarColor: 'var(--color-brand)',
            scrollbarWidth: 'thin',
          }}
        >
          {loading || iconsLoading ? <IconsColumnSkeleton /> : renderVirtualContent()}
        </div>
      </PopoverContent>
    </Popover>
  )
}
