import { isHotkey as isHotkeyBase } from 'platejs'
import { type HotkeysOptions } from 'platejs/react'

export const isHotkey = isHotkeyBase as <T extends React.KeyboardEvent>(
  hotkey: string | readonly string[],
  options?: HotkeysOptions,
) => (event: T) => boolean
