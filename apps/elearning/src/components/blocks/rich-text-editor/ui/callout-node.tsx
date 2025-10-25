'use client'

import { useCalloutEmojiPicker } from '@platejs/callout/react'
import { useEmojiDropdownMenuState } from '@platejs/emoji/react'
import { PlateElement } from 'platejs/react'

import { EmojiPicker, EmojiPopover } from '@/components/blocks/rich-text-editor/ui/emoji-toolbar-button'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const CalloutElement = ({
  attributes,
  children,
  className,
  ...props
}: React.ComponentProps<typeof PlateElement>) => {
  const { emojiPickerState, isOpen, setIsOpen } = useEmojiDropdownMenuState({
    closeOnSelect: true,
  })

  const { emojiToolbarDropdownProps, props: calloutProps } = useCalloutEmojiPicker({
    isOpen,
    setIsOpen,
  })

  return (
    <PlateElement
      attributes={{
        ...attributes,
        'data-plate-open-context-menu': true,
      }}
      className={cn('my-1 flex rounded-sm bg-muted p-4 pl-3', className)}
      style={{
        backgroundColor: props.element.backgroundColor as string,
      }}
      {...props}
    >
      <div className="flex w-full gap-2 rounded-md">
        <EmojiPopover
          {...emojiToolbarDropdownProps}
          control={
            <Button
              className="size-6 select-none p-1 text-[18px] hover:bg-muted-foreground/15"
              contentEditable={false}
              style={{
                fontFamily:
                  '"Apple Color Emoji", "Segoe UI Emoji", NotoColorEmoji, "Noto Color Emoji", "Segoe UI Symbol", "Android Emoji", EmojiSymbols',
              }}
              variant="ghost"
            >
              {(props.element.icon as string) || '💡'}
            </Button>
          }
        >
          <EmojiPicker {...emojiPickerState} {...calloutProps} />
        </EmojiPopover>
        <div className="w-full">{children}</div>
      </div>
    </PlateElement>
  )
}
