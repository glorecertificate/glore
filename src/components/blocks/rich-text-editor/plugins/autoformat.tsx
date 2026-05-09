import {
  BlockquoteRules,
  BoldRules,
  CodeRules,
  HeadingRules,
  HighlightRules,
  HorizontalRuleRules,
  ItalicRules,
  MarkComboRules,
  StrikethroughRules,
  SubscriptRules,
  SuperscriptRules,
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

const rule = (factory: (options: { enabled: typeof notInCodeBlock }) => AnyInputRule<unknown>) =>
  factory({ enabled: notInCodeBlock })

export const AutoformatKit = [
  createSlatePlugin({
    key: 'autoformat',
    inputRules: [
      rule(HeadingRules.markdown),
      rule(BlockquoteRules.markdown),
      rule(HorizontalRuleRules.markdown),
      MarkComboRules.markdown({ enabled: notInCodeBlock, variant: 'boldItalicUnderline' }),
      MarkComboRules.markdown({ enabled: notInCodeBlock, variant: 'boldItalic' }),
      MarkComboRules.markdown({ enabled: notInCodeBlock, variant: 'boldUnderline' }),
      MarkComboRules.markdown({ enabled: notInCodeBlock, variant: 'italicUnderline' }),
      rule(BoldRules.markdown),
      rule(ItalicRules.markdown),
      rule(UnderlineRules.markdown),
      rule(StrikethroughRules.markdown),
      rule(CodeRules.markdown),
      rule(SubscriptRules.markdown),
      rule(SuperscriptRules.markdown),
      rule(HighlightRules.markdown),
      rule(BulletedListRules.markdown),
      rule(OrderedListRules.markdown),
      rule(TaskListRules.markdown),
      TaskListRules.markdown({ checked: true, enabled: notInCodeBlock }),
      createTextSubstitutionInputRule({ enabled: notInCodeBlock, patterns: TYPOGRAPHY_PATTERNS }),
    ],
  }),
]
