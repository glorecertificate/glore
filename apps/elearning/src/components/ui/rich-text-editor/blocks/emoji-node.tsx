'use client'

import { useMemo, useState } from 'react'

import { EmojiInlineIndexSearch, insertEmoji } from '@platejs/emoji'
import { EmojiPlugin } from '@platejs/emoji/react'
import { PlateElement, usePluginOption, type PlateElementProps } from 'platejs/react'

import { useDebounce } from '@/hooks/use-debounce'
import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxInput,
  InlineComboboxItem,
} from '@rte/blocks/inline-combobox'

export const EmojiInputElement = (props: PlateElementProps) => {
  const { editor, element } = props
  const data = usePluginOption(EmojiPlugin, 'data')!
  const [value, setValue] = useState('')
  const debouncedValue = useDebounce(value, 100)
  const isPending = value !== debouncedValue

  const filteredEmojis = useMemo(() => {
    if (debouncedValue.trim().length === 0) return []
    return EmojiInlineIndexSearch.getInstance(data).search(debouncedValue.replace(/:$/, '')).get()
  }, [data, debouncedValue])

  return (
    <PlateElement as="span" {...props}>
      <InlineCombobox element={element} filter={false} hideWhenNoValue setValue={setValue} trigger=":" value={value}>
        <InlineComboboxInput />

        <InlineComboboxContent>
          {!isPending && <InlineComboboxEmpty>{'No results'}</InlineComboboxEmpty>}

          <InlineComboboxGroup>
            {filteredEmojis.map(emoji => (
              <InlineComboboxItem key={emoji.id} onClick={() => insertEmoji(editor, emoji)} value={emoji.name}>
                {emoji.skins[0].native} {emoji.name}
              </InlineComboboxItem>
            ))}
          </InlineComboboxGroup>
        </InlineComboboxContent>
      </InlineCombobox>
      {props.children}
    </PlateElement>
  )
}
