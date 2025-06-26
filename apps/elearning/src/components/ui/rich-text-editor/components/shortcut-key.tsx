import { useMemo } from 'react'

import { getShortcutKey } from '@/components/ui/rich-text-editor/utils'
import { cn } from '@/lib/utils'

export interface ShortcutKeyProps extends React.HTMLAttributes<HTMLSpanElement> {
  keys: string[]
}

export const ShortcutKey = ({ className, keys, ...props }: ShortcutKeyProps) => {
  const modifiedKeys = useMemo(() => keys.map(key => getShortcutKey(key)), [keys])
  const ariaLabel = useMemo(() => modifiedKeys.map(shortcut => shortcut.readable).join(' + '), [modifiedKeys])

  return (
    <span aria-label={ariaLabel} className={cn('inline-flex items-center gap-0.5', className)} {...props}>
      {modifiedKeys.map(shortcut => (
        <kbd
          className={cn(
            'inline-block min-w-2.5 text-center align-baseline font-sans text-xs font-medium text-[rgb(156,157,160)] capitalize',

            className,
          )}
          key={shortcut.symbol}
          {...props}
        >
          {shortcut.symbol}
        </kbd>
      ))}
    </span>
  )
}
