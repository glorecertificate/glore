import { execSync } from 'node:child_process'

import { RuleConfigSeverity, type UserConfig } from '@commitlint/types'

const PKG_NAMESPACE = '@repo'
const LIST_CMD = 'pnpm m ls --depth -1 --json'

const SCOPES = ['deps', 'deps-dev', 'dev', 'infra', 'release', 'security']

const packages = (JSON.parse(execSync(LIST_CMD, { encoding: 'utf8' })) as { name: string }[])
  .filter(({ name }) => name.startsWith(PKG_NAMESPACE))
  .map(({ name }) => name.replace(`${PKG_NAMESPACE}/`, ''))

export default {
  defaultIgnores: true,
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-max-line-length': [RuleConfigSeverity.Disabled],
    'footer-max-line-length': [RuleConfigSeverity.Error, 'always', 120],
    'scope-enum': [RuleConfigSeverity.Error, 'always', [...packages, ...SCOPES]],
    'subject-case': [RuleConfigSeverity.Error, 'always', 'sentence-case'],
  },
} satisfies UserConfig
