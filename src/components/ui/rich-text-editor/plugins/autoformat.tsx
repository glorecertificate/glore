import {
  BlockquoteRules,
  BoldRules,
  HeadingRules,
  HorizontalRuleRules,
  ItalicRules,
  MarkComboRules,
  StrikethroughRules,
  UnderlineRules,
} from '@platejs/basic-nodes'
import { BulletedListRules, OrderedListRules, TaskListRules } from '@platejs/list'
import {
  type AnyInputRule,
  KEYS,
  type SelectionInputRuleContext,
  type TextSubstitutionPattern,
  createSlatePlugin,
  createTextSubstitutionInputRule,
} from 'platejs'

import { hasPlugin, isMarkdownSafe } from '@/components/ui/rich-text-editor/utils'

const TYPOGRAPHY_PATTERNS: TextSubstitutionPattern[] = [
  { format: ['“', '”'], match: '"' },
  { format: ['‘', '’'], match: "'" },
  { format: '…', match: '...' },
  { format: '—', match: '--' },
  { format: '©', match: ['(c)', '(C)', '&copy;'] },
  { format: '®', match: ['(r)', '(R)', '&reg;'] },
  { format: '™', match: ['(tm)', '(TM)', '&trade;'] },
  { format: '℠', match: ['(sm)', '(SM)'] },
  { format: '↔', match: '<->' },
  { format: '⇔', match: '<=>' },
  { format: '→', match: '->' },
  { format: '←', match: '<-' },
  { format: '⇒', match: '=>' },
  { format: '±', match: ['+-', '+/-'] },
  { format: '≠', match: '!=' },
  { format: '≈', match: '~=' },
  { format: '½', match: '1/2' },
  { format: '¼', match: '1/4' },
  { format: '¾', match: '3/4' },
]

const notInCodeBlock = ({ editor }: SelectionInputRuleContext) =>
  !editor.api.some({ match: { type: editor.getType(KEYS.codeBlock) } })

const underlineAllowed = ({ editor }: SelectionInputRuleContext) => hasPlugin(editor, KEYS.underline)

const todoAllowed = ({ editor }: SelectionInputRuleContext) => !isMarkdownSafe(editor)

type Enabled = (context: SelectionInputRuleContext) => boolean

const gate = (inputRule: AnyInputRule<unknown>, allowed: Enabled): AnyInputRule<unknown> => {
  const { enabled } = inputRule as { enabled?: Enabled }
  return {
    ...inputRule,
    enabled: (context: SelectionInputRuleContext) => allowed(context) && (enabled?.(context) ?? true),
  } as AnyInputRule<unknown>
}

const rule = (factory: (options: { enabled: typeof notInCodeBlock }) => AnyInputRule<unknown>) =>
  factory({ enabled: notInCodeBlock })

export const AutoformatKit = [
  createSlatePlugin({
    key: 'typing-rules',
    inputRules: [
      rule(HeadingRules.markdown),
      rule(BlockquoteRules.markdown),
      rule(HorizontalRuleRules.markdown),
      gate(MarkComboRules.markdown({ enabled: notInCodeBlock, variant: 'boldItalicUnderline' }), underlineAllowed),
      MarkComboRules.markdown({ enabled: notInCodeBlock, variant: 'boldItalic' }),
      gate(MarkComboRules.markdown({ enabled: notInCodeBlock, variant: 'boldUnderline' }), underlineAllowed),
      gate(MarkComboRules.markdown({ enabled: notInCodeBlock, variant: 'italicUnderline' }), underlineAllowed),
      rule(BoldRules.markdown),
      rule(ItalicRules.markdown),
      gate(rule(UnderlineRules.markdown), underlineAllowed),
      rule(StrikethroughRules.markdown),
      rule(BulletedListRules.markdown),
      rule(OrderedListRules.markdown),
      gate(rule(TaskListRules.markdown), todoAllowed),
      gate(TaskListRules.markdown({ checked: true, enabled: notInCodeBlock }), todoAllowed),
      createTextSubstitutionInputRule({ enabled: notInCodeBlock, patterns: TYPOGRAPHY_PATTERNS }),
    ],
  }),
]
