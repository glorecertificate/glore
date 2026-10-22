import { describe, expect, it } from 'vitest'

import { parseLessonFile } from './load.mts'

const EM_DASH = String.fromCharCode(0x2014)
const EN_DASH = String.fromCharCode(0x2013)
const FILE = 'courses/x/lessons/1.en.md'

describe('parseLessonFile', () => {
  it('parses front matter and body', () => {
    const { lesson, problems } = parseLessonFile(
      FILE,
      `---
title: Hello
questions:
  - question: Q?
    options:
      - text: A
      - text: B
        correct: true
    explanation: Because.
evaluations:
  - I can.
assessment: Rate yourself.
---

Body text.
`
    )

    expect(problems).toEqual([])
    expect(lesson).toEqual({
      assessment: 'Rate yourself.',
      body: 'Body text.',
      evaluations: ['I can.'],
      path: FILE,
      questions: [
        {
          explanation: 'Because.',
          options: [
            { correct: false, text: 'A' },
            { correct: true, text: 'B' },
          ],
          question: 'Q?',
        },
      ],
      title: 'Hello',
    })
  })

  it('accepts CRLF line endings and an empty body', () => {
    const { lesson, problems } = parseLessonFile(FILE, '---\r\ntitle: Hello\r\n---\r\n')

    expect(problems).toEqual([])
    expect(lesson).toMatchObject({ body: '', title: 'Hello' })
  })

  it('reports a missing front matter block', () => {
    const { lesson, problems } = parseLessonFile(FILE, 'Just text')

    expect(lesson).toBeNull()
    expect(problems).toEqual([{ file: FILE, message: 'missing front matter (--- block at the top)' }])
  })

  it('reports invalid YAML', () => {
    const { lesson, problems } = parseLessonFile(FILE, '---\ntitle: [unclosed\n---\nBody')

    expect(lesson).toBeNull()
    expect(problems[0].message).toMatch(/^invalid YAML front matter/u)
  })

  it('reports every unknown key and schema issue together', () => {
    const { lesson, problems } = parseLessonFile(
      FILE,
      `---
title: Hello
level: 3
questions:
  - question: Q?
    hint: nope
    options:
      - text: A
        right: true
---
Body`
    )

    expect(lesson).toBeNull()
    const messages = problems.map(({ message }) => message)
    expect(messages).toContain('unknown key "level"')
    expect(messages).toContain('questions[0]: unknown key "hint"')
    expect(messages).toContain('questions[0].options[0]: unknown key "right"')
    expect(messages.some(message => message.startsWith('questions[0].explanation'))).toBe(true)
  })

  it('rejects a missing title', () => {
    const { problems } = parseLessonFile(FILE, '---\nevaluations:\n  - I can.\n---\nBody')

    expect(problems.some(({ message }) => message.startsWith('title'))).toBe(true)
  })

  it('rejects em and en dashes with their line numbers', () => {
    const { problems } = parseLessonFile(FILE, `---\ntitle: Hello\n---\nOne ${EM_DASH} two\nThree ${EN_DASH} four`)

    expect(problems.map(({ message }) => message)).toEqual([
      'line 4: em and en dashes are not allowed',
      'line 5: em and en dashes are not allowed',
    ])
  })
})
