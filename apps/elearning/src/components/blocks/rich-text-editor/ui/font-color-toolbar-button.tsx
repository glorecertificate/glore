'use client'

import { Children, cloneElement, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useComposedRef } from '@udecode/cn'
import { EraserIcon, PlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEditorRef, useEditorSelector } from 'platejs/react'

import { FontColorIcon } from '@/components/icons/font-color'
import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  type DropdownMenuItemProps,
  type DropdownMenuProps,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ToolbarButton, ToolbarMenuGroup } from '@/components/ui/toolbar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export const useColors = () => {
  const t = useTranslations('Editor.colors')

  return useMemo(
    () => ({
      colors: [
        {
          isBrightColor: false,
          name: t('black'),
          value: '#000000',
        },
        {
          isBrightColor: false,
          name: t('darkGrey4'),
          value: '#434343',
        },
        {
          isBrightColor: false,
          name: t('darkGrey3'),
          value: '#666666',
        },
        {
          isBrightColor: false,
          name: t('darkGrey2'),
          value: '#999999',
        },
        {
          isBrightColor: false,
          name: t('darkGrey1'),
          value: '#B7B7B7',
        },
        {
          isBrightColor: false,
          name: t('grey'),
          value: '#CCCCCC',
        },
        {
          isBrightColor: false,
          name: t('lightGrey1'),
          value: '#D9D9D9',
        },
        {
          isBrightColor: true,
          name: t('lightGrey2'),
          value: '#EFEFEF',
        },
        {
          isBrightColor: true,
          name: t('lightGrey3'),
          value: '#F3F3F3',
        },
        {
          isBrightColor: true,
          name: t('white'),
          value: '#FFFFFF',
        },
        {
          isBrightColor: false,
          name: t('redBerry'),
          value: '#980100',
        },
        {
          isBrightColor: false,
          name: t('red'),
          value: '#FE0000',
        },
        {
          isBrightColor: false,
          name: t('orange'),
          value: '#FE9900',
        },
        {
          isBrightColor: true,
          name: t('yellow'),
          value: '#FEFF00',
        },
        {
          isBrightColor: false,
          name: t('green'),
          value: '#00FF00',
        },
        {
          isBrightColor: false,
          name: t('cyan'),
          value: '#00FFFF',
        },
        {
          isBrightColor: false,
          name: t('cornflowerBlue'),
          value: '#4B85E8',
        },
        {
          isBrightColor: false,
          name: t('blue'),
          value: '#1300FF',
        },
        {
          isBrightColor: false,
          name: t('purple'),
          value: '#9900FF',
        },
        {
          isBrightColor: false,
          name: t('magenta'),
          value: '#FF00FF',
        },

        {
          isBrightColor: false,
          name: t('lightRedBerry3'),
          value: '#E6B8AF',
        },
        {
          isBrightColor: false,
          name: t('lightRed3'),
          value: '#F4CCCC',
        },
        {
          isBrightColor: true,
          name: t('lightOrange3'),
          value: '#FCE4CD',
        },
        {
          isBrightColor: true,
          name: t('lightYellow3'),
          value: '#FFF2CC',
        },
        {
          isBrightColor: true,
          name: t('lightGreen3'),
          value: '#D9EAD3',
        },
        {
          isBrightColor: false,
          name: t('lightCyan3'),
          value: '#D0DFE3',
        },
        {
          isBrightColor: false,
          name: t('lightCornflowerBlue3'),
          value: '#C9DAF8',
        },
        {
          isBrightColor: true,
          name: t('lightBlue3'),
          value: '#CFE1F3',
        },
        {
          isBrightColor: true,
          name: t('lightPurple3'),
          value: '#D9D2E9',
        },
        {
          isBrightColor: true,
          name: t('lightMagenta3'),
          value: '#EAD1DB',
        },

        {
          isBrightColor: false,
          name: t('lightRedBerry2'),
          value: '#DC7E6B',
        },
        {
          isBrightColor: false,
          name: t('lightRed2'),
          value: '#EA9999',
        },
        {
          isBrightColor: false,
          name: t('lightOrange2'),
          value: '#F9CB9C',
        },
        {
          isBrightColor: true,
          name: t('lightYellow2'),
          value: '#FFE598',
        },
        {
          isBrightColor: false,
          name: t('lightGreen2'),
          value: '#B7D6A8',
        },
        {
          isBrightColor: false,
          name: t('lightCyan2'),
          value: '#A1C4C9',
        },
        {
          isBrightColor: false,
          name: t('lightCornflowerBlue2'),
          value: '#A4C2F4',
        },
        {
          isBrightColor: false,
          name: t('lightBlue2'),
          value: '#9FC5E8',
        },
        {
          isBrightColor: false,
          name: t('lightPurple2'),
          value: '#B5A7D5',
        },
        {
          isBrightColor: false,
          name: t('lightMagenta2'),
          value: '#D5A6BD',
        },

        {
          isBrightColor: false,
          name: t('lightRedBerry1'),
          value: '#CC4125',
        },
        {
          isBrightColor: false,
          name: t('lightRed1'),
          value: '#E06666',
        },
        {
          isBrightColor: false,
          name: t('lightOrange1'),
          value: '#F6B26B',
        },
        {
          isBrightColor: false,
          name: t('lightYellow1'),
          value: '#FFD966',
        },
        {
          isBrightColor: false,
          name: t('lightGreen1'),
          value: '#93C47D',
        },
        {
          isBrightColor: false,
          name: t('lightCyan1'),
          value: '#76A5AE',
        },
        {
          isBrightColor: false,
          name: t('lightCornflowerBlue1'),
          value: '#6C9EEB',
        },
        {
          isBrightColor: false,
          name: t('lightBlue1'),
          value: '#6FA8DC',
        },
        {
          isBrightColor: false,
          name: t('lightPurple1'),
          value: '#8D7CC3',
        },
        {
          isBrightColor: false,
          name: t('lightMagenta1'),
          value: '#C27BA0',
        },

        {
          isBrightColor: false,
          name: t('darkRedBerry1'),
          value: '#A61B00',
        },
        {
          isBrightColor: false,
          name: t('darkRed1'),
          value: '#CC0000',
        },
        {
          isBrightColor: false,
          name: t('darkOrange1'),
          value: '#E59138',
        },
        {
          isBrightColor: false,
          name: t('darkYellow1'),
          value: '#F1C231',
        },
        {
          isBrightColor: false,
          name: t('darkGreen1'),
          value: '#6AA74F',
        },
        {
          isBrightColor: false,
          name: t('darkCyan1'),
          value: '#45818E',
        },
        {
          isBrightColor: false,
          name: t('darkCornflowerBlue1'),
          value: '#3B78D8',
        },
        {
          isBrightColor: false,
          name: t('darkBlue1'),
          value: '#3E84C6',
        },
        {
          isBrightColor: false,
          name: t('darkPurple1'),
          value: '#664EA6',
        },
        {
          isBrightColor: false,
          name: t('darkMagenta1'),
          value: '#A64D78',
        },

        {
          isBrightColor: false,
          name: t('darkRedBerry2'),
          value: '#84200D',
        },
        {
          isBrightColor: false,
          name: t('darkRed2'),
          value: '#990001',
        },
        {
          isBrightColor: false,
          name: t('darkOrange2'),
          value: '#B45F05',
        },
        {
          isBrightColor: false,
          name: t('darkYellow2'),
          value: '#BF9002',
        },
        {
          isBrightColor: false,
          name: t('darkGreen2'),
          value: '#38761D',
        },
        {
          isBrightColor: false,
          name: t('darkCyan2'),
          value: '#124F5C',
        },
        {
          isBrightColor: false,
          name: t('darkCornflowerBlue2'),
          value: '#1155CB',
        },
        {
          isBrightColor: false,
          name: t('darkBlue2'),
          value: '#0C5394',
        },
        {
          isBrightColor: false,
          name: t('darkPurple2'),
          value: '#351C75',
        },
        {
          isBrightColor: false,
          name: t('darkMagenta2'),
          value: '#741B47',
        },

        {
          isBrightColor: false,
          name: t('darkRedBerry3'),
          value: '#5B0F00',
        },
        {
          isBrightColor: false,
          name: t('darkRed3'),
          value: '#660000',
        },
        {
          isBrightColor: false,
          name: t('darkOrange3'),
          value: '#783F04',
        },
        {
          isBrightColor: false,
          name: t('darkYellow3'),
          value: '#7E6000',
        },
        {
          isBrightColor: false,
          name: t('darkGreen3'),
          value: '#274E12',
        },
        {
          isBrightColor: false,
          name: t('darkCyan3'),
          value: '#0D343D',
        },
        {
          isBrightColor: false,
          name: t('darkCornflowerBlue3'),
          value: '#1B4487',
        },
        {
          isBrightColor: false,
          name: t('darkBlue3'),
          value: '#083763',
        },
        {
          isBrightColor: false,
          name: t('darkPurple3'),
          value: '#1F124D',
        },
        {
          isBrightColor: false,
          name: t('darkMagenta3'),
          value: '#4C1130',
        },
      ],
      customColors: [
        {
          isBrightColor: false,
          name: t('darkOrange3'),
          value: '#783F04',
        },
        {
          isBrightColor: false,
          name: t('darkGrey3'),
          value: '#666666',
        },
        {
          isBrightColor: false,
          name: t('darkGrey2'),
          value: '#999999',
        },
        {
          isBrightColor: false,
          name: t('lightCornflowerBlue1'),
          value: '#6C9EEB',
        },
        {
          isBrightColor: false,
          name: t('darkMagenta3'),
          value: '#4C1130',
        },
      ],
    }),
    [t]
  )
}

export const FontColorToolbarButton = ({
  nodeType,
  tooltip,
}: {
  nodeType: string
  tooltip?: string
} & DropdownMenuProps) => {
  const editor = useEditorRef()
  const selectionDefined = useEditorSelector(editor => !!editor.selection, [])
  const color = useEditorSelector(editor => editor.api.mark(nodeType) as string, [nodeType])
  const { colors, customColors } = useColors()

  const [selectedColor, setSelectedColor] = useState<string>()
  const [open, setOpen] = useState(false)

  const updateColor = useCallback(
    (value: string) => {
      if (editor.selection) {
        setSelectedColor(value)

        editor.tf.select(editor.selection)
        editor.tf.focus()

        editor.tf.addMarks({ [nodeType]: value })
      }
    },
    [editor, nodeType]
  )

  const clearColor = useCallback(() => {
    if (editor.selection) {
      editor.tf.select(editor.selection)
      editor.tf.focus()

      if (selectedColor) {
        editor.tf.removeMarks(nodeType)
      }
    }
  }, [editor, selectedColor, nodeType])

  useEffect(() => {
    if (selectionDefined) {
      setSelectedColor(color)
    }
  }, [color, selectionDefined])

  return (
    <DropdownMenu
      modal={false}
      onOpenChange={value => {
        setOpen(value)
      }}
      open={open}
    >
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip={tooltip}>
          <FontColorIcon color={selectedColor || color} />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <ColorPicker
          clearColor={clearColor}
          color={selectedColor || color}
          colors={colors}
          customColors={customColors}
          updateColor={updateColor}
          updateCustomColor={updateColor}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const PureColorPicker = ({
  className,
  clearColor,
  color,
  colors,
  customColors,
  updateColor,
  updateCustomColor,
  ...props
}: React.ComponentProps<'div'> & {
  colors: TColor[]
  customColors: TColor[]
  clearColor: () => void
  updateColor: (color: string) => void
  updateCustomColor: (color: string) => void
  color?: string
}) => {
  const t = useTranslations('Editor.colors')

  return (
    <div className={cn('flex flex-col', className)} {...props}>
      <ToolbarMenuGroup label={t('customColors')}>
        <ColorCustom
          className="px-2"
          color={color}
          colors={colors}
          customColors={customColors}
          updateColor={updateColor}
          updateCustomColor={updateCustomColor}
        />
      </ToolbarMenuGroup>
      <ToolbarMenuGroup label={t('defaultColors')}>
        <ColorDropdownMenuItems className="px-2" color={color} colors={colors} updateColor={updateColor} />
      </ToolbarMenuGroup>
      {color && (
        <ToolbarMenuGroup>
          <DropdownMenuItem className="p-2" onClick={clearColor}>
            <EraserIcon className="stroke-foreground" />
            <span>{t('clear')}</span>
          </DropdownMenuItem>
        </ToolbarMenuGroup>
      )}
    </div>
  )
}

const ColorPicker = memo(
  PureColorPicker,
  (prev, next) => prev.color === next.color && prev.colors === next.colors && prev.customColors === next.customColors
)

const ColorCustom = ({
  className,
  color,
  colors,
  customColors,
  updateColor,
  updateCustomColor,
  ...props
}: {
  colors: TColor[]
  customColors: TColor[]
  updateColor: (color: string) => void
  updateCustomColor: (color: string) => void
  color?: string
} & React.ComponentPropsWithoutRef<'div'>) => {
  const [customColor, setCustomColor] = useState<string>()
  const [value, setValue] = useState<string>(color || '#000000')

  useEffect(() => {
    if (!color || customColors.some(c => c.value === color) || colors.some(c => c.value === color)) {
      return
    }
    setCustomColor(color)
  }, [color, colors, customColors])

  const computedColors = useMemo(
    () =>
      customColor
        ? [
            ...customColors,
            {
              isBrightColor: false,
              name: '',
              value: customColor,
            },
          ]
        : customColors,
    [customColor, customColors]
  )
  const updateCustomColorDebounced = useCallback(<T,>(callback: T) => {
    const handler = setTimeout(() => callback, 100)
    return () => clearTimeout(handler)
  }, [])

  return (
    <div className={cn('relative flex flex-col gap-4', className)} {...props}>
      <ColorDropdownMenuItems color={color} colors={computedColors} showTitles={false} updateColor={updateColor}>
        <ColorInput
          onChange={e => {
            setValue(e.target.value)
            updateCustomColorDebounced(e.target.value)
          }}
          value={value}
        >
          <DropdownMenuItem
            className={cn(
              buttonVariants({
                size: 'icon',
                variant: 'outline',
              }),
              'absolute top-1 right-2 bottom-2 flex size-8 items-center justify-center rounded-full'
            )}
            onSelect={e => {
              e.preventDefault()
            }}
          >
            <span className="sr-only">{'Custom'}</span>
            <PlusIcon />
          </DropdownMenuItem>
        </ColorInput>
      </ColorDropdownMenuItems>
    </div>
  )
}

const ColorInput = ({ children, className, value = '#000000', ...props }: React.ComponentProps<'input'>) => {
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <div className="flex flex-col items-center">
      {Children.map(children, child => {
        if (!child) return child

        return cloneElement(
          child as React.ReactElement<{
            onClick: () => void
          }>,
          {
            onClick: () => inputRef.current?.click(),
          }
        )
      })}
      <input
        {...props}
        className={cn('size-0 overflow-hidden border-0 p-0', className)}
        ref={useComposedRef(props.ref, inputRef)}
        type="color"
        value={value}
      />
    </div>
  )
}

interface TColor {
  isBrightColor: boolean
  name: string
  value: string
}

const ColorDropdownMenuItem = ({
  className,
  isBrightColor,
  isSelected,
  name,
  updateColor,
  value,
  ...props
}: {
  isBrightColor: boolean
  isSelected: boolean
  value: string
  updateColor: (color: string) => void
  name?: string
} & DropdownMenuItemProps) => (
  <DropdownMenuItem
    className={cn(
      'my-1 flex size-5 rounded-full border p-0 shadow-2xs transition-all hover:scale-110',
      isBrightColor ? 'border-muted' : 'border-transparent',
      isSelected && 'border-foreground',
      className
    )}
    onSelect={e => {
      e.preventDefault()
      updateColor(value)
    }}
    style={{ backgroundColor: value }}
    {...props}
  />
)

export const ColorDropdownMenuItems = ({
  className,
  color,
  colors,
  showTitles = true,
  updateColor,
  ...props
}: {
  color?: string
  colors: TColor[]
  showTitles?: boolean
  updateColor: (color: string) => void
} & React.ComponentProps<'div'>) => (
  <div className={cn('grid grid-cols-[repeat(10,1fr)] place-items-center gap-x-1.5', className)} {...props}>
    <TooltipProvider>
      {colors.map(({ isBrightColor, name, value }) => (
        <ColorDropdownMenuItem
          isBrightColor={isBrightColor}
          isSelected={color === value}
          key={name ?? value}
          name={name}
          title={showTitles ? name : undefined}
          updateColor={updateColor}
          value={value}
        />
      ))}
      {props.children}
    </TooltipProvider>
  </div>
)
