import { describe, expect, it } from 'vitest'

import { type CommandContext, type CommandMessage, buildCommandPrompt } from '@/app/api/v1/ai/command/prompt'

const children = [
  { children: [{ text: 'Volunteering builds teamwork.' }], id: 'a', type: 'p' },
  { children: [{ text: 'Second paragraph here.' }], id: 'b', type: 'p' },
]

const user = (text: string): CommandMessage => ({ id: 'm', parts: [{ text, type: 'text' }], role: 'user' })
const assistant = (text: string): CommandMessage => ({ id: 'n', parts: [{ text, type: 'text' }], role: 'assistant' })

const ctx = (selection: CommandContext['selection']): CommandContext => ({ children, selection })

describe('buildCommandPrompt', () => {
  it('marks the selected text and keeps the instruction for a single-block selection', () => {
    const prompt = buildCommandPrompt({
      ctx: ctx({ anchor: { offset: 0, path: [0, 0] }, focus: { offset: 12, path: [0, 0] } }),
      messages: [user('Improve the writing')],
    })
    expect(prompt).toContain('<Selection>Volunteering</Selection> builds teamwork.')
    expect(prompt).toContain('Improve the writing')
    expect(prompt).not.toContain('Second paragraph')
  })

  it('sends whole blocks for a multi-block selection', () => {
    const prompt = buildCommandPrompt({
      ctx: ctx({ anchor: { offset: 2, path: [0, 0] }, focus: { offset: 3, path: [1, 0] } }),
      messages: [user('Make it shorter')],
    })
    expect(prompt).toContain('Volunteering builds teamwork.')
    expect(prompt).toContain('Second paragraph here.')
  })

  it('gives the document as context without a selection and expands {editor}', () => {
    const prompt = buildCommandPrompt({
      ctx: ctx({ anchor: { offset: 3, path: [1, 0] }, focus: { offset: 3, path: [1, 0] } }),
      messages: [user('Summarize {editor}')],
    })
    expect(prompt).not.toContain('{editor}')
    expect(prompt).toContain('Volunteering builds teamwork.')
    expect(prompt).not.toContain('<Selection>')
  })

  it('works without a selection at all', () => {
    const prompt = buildCommandPrompt({ ctx: ctx(null), messages: [user('Write a sentence about teamwork')] })
    expect(prompt).toContain('Write a sentence about teamwork')
  })

  it('adds earlier turns as history and uses the last user message as the instruction', () => {
    const prompt = buildCommandPrompt({
      ctx: ctx({ anchor: { offset: 0, path: [0, 0] }, focus: { offset: 12, path: [0, 0] } }),
      messages: [user('Improve the writing'), assistant('Volunteering fosters collaboration'), user('Make it formal')],
    })
    expect(prompt).toContain('ASSISTANT: Volunteering fosters collaboration')
    expect(prompt).toMatch(/<instruction>\s*Make it formal\s*<\/instruction>/u)
  })
})

describe('buildCommandPrompt cursor block', () => {
  it('marks the cursor block and defines the marker without leaking a placeholder', () => {
    const prompt = buildCommandPrompt({
      ctx: ctx({ anchor: { offset: 3, path: [0, 0] }, focus: { offset: 3, path: [0, 0] } }),
      messages: [user('Continue writing right after the marked block.')],
    })
    expect(prompt).toContain('<Block>Volunteering builds teamwork.</Block>')
    expect(prompt).toContain('Never output the <Block> tags')
    expect(prompt).not.toContain('[Block]')
    expect(prompt).toContain('Second paragraph here.')
  })
})
