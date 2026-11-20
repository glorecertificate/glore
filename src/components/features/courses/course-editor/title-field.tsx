'use client'

import { useEffect, useState } from 'react'

import { InlineInput } from '@/components/ui/inline-input'
import { debounce } from '@/lib/utils'

const DEBOUNCE_DELAY = 400

interface TitleFieldProps extends Omit<
  React.ComponentProps<typeof InlineInput>,
  'onBlur' | 'onChange' | 'onFocus' | 'value'
> {
  onCommit: (value: string) => void
  onLengthChange: (length: number | null) => void
  value: string
}

export const TitleField = ({ onCommit, onLengthChange, value, ...props }: TitleFieldProps) => {
  const [editing, setEditing] = useState<string | null>(null)
  const [commit] = useState(() => debounce((next: string) => onCommit(next), DEBOUNCE_DELAY))
  const draft = editing ?? value

  useEffect(
    () => () => {
      commit.cancel()
    },
    [commit]
  )

  const onChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditing(event.target.value)
    onLengthChange(event.target.value.length)
    commit(event.target.value)
  }

  const onBlur = () => {
    commit.cancel()
    setEditing(null)
    onLengthChange(null)
    const trimmed = draft.trim()
    if (trimmed === '' || trimmed === value) return
    onCommit(draft)
  }

  return <InlineInput {...props} onBlur={onBlur} onChange={onChange} value={draft} />
}
