'use client'

import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { useModifierKey } from '@/hooks/use-modifier-key'
import { type Shortcut } from '@/lib/shortcuts'

const KEY_LABELS: Record<string, string> = { enter: '↵' }

export const KbdShortcut = ({ shortcut, ...props }: React.ComponentProps<typeof KbdGroup> & { shortcut: Shortcut }) => {
  const modifierKey = useModifierKey()

  return (
    <KbdGroup {...props}>
      {shortcut.mod && <Kbd>{modifierKey}</Kbd>}
      <Kbd>{KEY_LABELS[shortcut.key] ?? shortcut.key.toUpperCase()}</Kbd>
    </KbdGroup>
  )
}
