import { RuleConfigSeverity, type UserConfig } from '@commitlint/types'

export default {
  defaultIgnores: true,
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-max-line-length': [RuleConfigSeverity.Disabled],
    'footer-max-line-length': [RuleConfigSeverity.Error, 'always', 120],
    'scope-enum': [
      RuleConfigSeverity.Error,
      'always',
      ['deps', 'deps-dev', 'dev', 'infra', 'release', 'security', 'ui'],
    ],
    'subject-case': [RuleConfigSeverity.Error, 'always', 'sentence-case'],
  },
} satisfies UserConfig
