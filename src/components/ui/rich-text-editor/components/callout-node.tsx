'use client'

import { PlateElement } from 'platejs/react'

import { cn } from '@/lib/utils'

const emojiFontFamilyStyle: React.CSSProperties = {
  fontFamily:
    '"Apple Color Emoji", "Segoe UI Emoji", NotoColorEmoji, "Noto Color Emoji", "Segoe UI Symbol", "Android Emoji", EmojiSymbols',
}

export const CalloutElement = ({
  attributes,
  children,
  className,
  ...props
}: React.ComponentProps<typeof PlateElement>) => {
  const calloutAttributes = { ...attributes, 'data-plate-open-context-menu': true }
  const bgStyle = { backgroundColor: props.element.backgroundColor as string }

  return (
    <PlateElement
      attributes={calloutAttributes}
      className={cn('my-1 flex rounded-sm bg-muted p-4 pl-3', className)}
      style={bgStyle}
      {...props}
    >
      <div className="flex w-full gap-2 rounded-md">
        <div
          className="flex size-6 shrink-0 items-center justify-center text-[18px] select-none"
          contentEditable={false}
          style={emojiFontFamilyStyle}
        >
          {(props.element.icon as string) || '💡'}
        </div>
        <div className="w-full">{children}</div>
      </div>
    </PlateElement>
  )
}
