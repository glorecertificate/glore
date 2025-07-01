import { execSync } from 'node:child_process'

import { RuleConfigSeverity, type UserConfig } from '@commitlint/types'

interface Package {
  name: string
  path: string
  private: boolean
  version: string
}

const NAMESPACE = '@repo'
const LIST_CMD = 'pnpm m ls --depth -1 --json'
const BASE_SCOPES = ['deps', 'deps-dev', 'dev', 'infra', 'security']

const packages = JSON.parse(execSync(LIST_CMD, { encoding: 'utf8' })) as Package[]
const packageNames = packages
  .filter(pkg => pkg.name.startsWith(NAMESPACE))
  .map((pkg: Package) => pkg.name.replace(`${NAMESPACE}/`, ''))

export default {
  defaultIgnores: true,
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-max-line-length': [RuleConfigSeverity.Disabled],
    'scope-enum': [RuleConfigSeverity.Error, 'always', [...packageNames, ...BASE_SCOPES]],
  },
} satisfies UserConfig
