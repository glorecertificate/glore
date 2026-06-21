'use client'

import { useEffect, useState } from 'react'

import { type EmojiMartData } from '@emoji-mart/data'
import { EmojiInlineIndexSearch, insertEmoji } from '@platejs/emoji'
import { useTranslations } from 'next-intl'
import { PlateElement, type PlateElementProps } from 'platejs/react'

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxInput,
  InlineComboboxItem,
} from '@/components/ui/rich-text-editor/components/inline-combobox'
import { useDebounce } from '@/hooks/use-debounce'

export const EmojiInputElement = (props: PlateElementProps) => {
  const { editor, element } = props
  const t = useTranslations('Components.RichTextEditor.emoji')

  const [data, setData] = useState<EmojiMartData>()
  const [value, setValue] = useState('')
  const debouncedValue = useDebounce(value, 100)
  const isPending = value !== debouncedValue

  useEffect(() => {
    let active = true
    const load = async () => {
      const m = await import('@emoji-mart/data')
      if (active) setData(m.default as EmojiMartData)
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  const filteredEmojis = (() => {
    if (!data || debouncedValue.trim().length === 0) {
      return []
    }
    return EmojiInlineIndexSearch.getInstance(data).search(debouncedValue.replace(/:$/u, '')).get()
  })()

  return (
    <PlateElement as="span" {...props}>
      <InlineCombobox element={element} filter={false} hideWhenNoValue setValue={setValue} trigger=":" value={value}>
        <InlineComboboxInput />

        <InlineComboboxContent>
          {!isPending && <InlineComboboxEmpty>{t('searchNoResultsTitle')}</InlineComboboxEmpty>}

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
