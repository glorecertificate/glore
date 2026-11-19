import { startTransition, useState } from 'react'

export const useDraft = (value: string, onCommit: (value: string) => void) => {
  const [draft, setDraft] = useState(value)
  const [synced, setSynced] = useState(value)

  if (value !== synced) {
    setSynced(value)
    setDraft(value)
  }

  const onChange = (next: string) => {
    setDraft(next)
    startTransition(() => onCommit(next))
  }

  const onBlur = () => {
    if (draft !== value) onCommit(draft)
  }

  return { draft, onBlur, onChange }
}
