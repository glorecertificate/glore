import { SlateElement, type SlateElementProps } from 'platejs/static'

import { cn } from '@/lib/utils'

const fontFamilyStyle: React.CSSProperties = {
  fontFamily:
    '"Apple Color Emoji", "Segoe UI Emoji", NotoColorEmoji, "Noto Color Emoji", "Segoe UI Symbol", "Android Emoji", EmojiSymbols',
}

export const CalloutElementStatic = ({
  children,
  className,
  ...props
}: SlateElementProps & {
  className?: string
}) => {
  // oxlint-disable-next-line
  const bgStyle: React.CSSProperties = { backgroundColor: props.element.backgroundColor as string }

  return (
    <SlateElement className={cn('my-1 flex rounded-sm bg-muted p-4 pl-3', className)} style={bgStyle} {...props}>
      <div className="flex w-full gap-2 rounded-md">
        <div className="size-6 text-[18px] select-none" style={fontFamilyStyle}>
          <span data-plate-prevent-deserialization>{(props.element.icon as string) || '💡'}</span>
        </div>
        <div className="w-full">{children}</div>
      </div>
    </SlateElement>
  )
}
