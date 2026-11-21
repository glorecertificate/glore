import { readFileSync } from 'node:fs'

import { type OxlintConfig, defineConfig } from 'oxlint'

const ROOT = '../..'

const { ignorePatterns = [], ...base } = JSON.parse(
  readFileSync(new URL(`${ROOT}/.oxlintrc.json`, import.meta.url), 'utf8')
) as OxlintConfig

const fromRoot = (path: string) => (path.startsWith('./') ? `${ROOT}/${path.slice(2)}` : path)

const anyDepth = (pattern: string) => `**/${pattern}`

const typingRules = new Set(['react-compiler/exhaustive-deps', 'react-compiler/rules-of-hooks'])

const isCompilerRule = (rule: string) => rule.startsWith('react-compiler/') && !typingRules.has(rule)

const editorConfig = defineConfig({
  ...base,
  jsPlugins: base.jsPlugins?.map(plugin =>
    typeof plugin === 'string' ? fromRoot(plugin) : { ...plugin, specifier: fromRoot(plugin.specifier) }
  ),
  overrides: [
    ...(base.overrides ?? []).map(override => ({ ...override, files: override.files.map(anyDepth) })),
    {
      files: ignorePatterns.map(anyDepth),
      jsPlugins: [],
      plugins: [],
      rules: Object.fromEntries(Object.keys(base.rules ?? {}).map(rule => [rule, 'off'])),
    },
  ],
  rules: Object.fromEntries(Object.entries(base.rules ?? {}).filter(([rule]) => !isCompilerRule(rule))),
})

export default editorConfig
