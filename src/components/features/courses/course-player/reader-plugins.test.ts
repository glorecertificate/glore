import { createPlateEditor } from 'platejs/react'
import { describe, expect, it } from 'vitest'

import { READER_PLUGINS } from '@/components/features/courses/course-player/reader-plugins'

const EDITING_ONLY_KEYS = ['ai', 'aiChat', 'copilot', 'dnd', 'emoji', 'slash_command', 'selection', 'blockMenu']

describe('READER_PLUGINS', () => {
  const editor = createPlateEditor({ plugins: READER_PLUGINS })
  const keys = Object.keys(editor.plugins)

  it('registers the read-only content plugins', () => {
    expect(keys).toEqual(expect.arrayContaining(['p', 'h1', 'bold', 'a', 'img', 'table', 'callout', 'list', 'toggle']))
  })

  it('excludes the AI and editing-only plugins', () => {
    for (const key of EDITING_ONLY_KEYS) expect(keys).not.toContain(key)
  })
})
