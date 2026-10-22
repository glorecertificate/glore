import { defineConfig } from 'oxlint'

import base from './.oxlintrc.json' with { type: 'json' }

const typingRules = new Set(['react-compiler/exhaustive-deps', 'react-compiler/rules-of-hooks'])

const isCompilerRule = (rule: string) => rule.startsWith('react-compiler/') && !typingRules.has(rule)

const editorConfig = defineConfig({
  ...base,
  rules: Object.fromEntries(Object.entries(base.rules).filter(([rule]) => !isCompilerRule(rule))),
})

export default editorConfig
