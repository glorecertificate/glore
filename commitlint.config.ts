import { RuleConfigSeverity, type UserConfig } from '@commitlint/types'

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      RuleConfigSeverity.Error,
      'always',
      ['feat', 'fix', 'docs', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'],
    ],
    'scope-enum': [RuleConfigSeverity.Error, 'always', ['release', 'deps', 'deps-dev', 'security']],
    'subject-empty': [RuleConfigSeverity.Error, 'never'],
    'header-max-length': [RuleConfigSeverity.Error, 'always', 100],
    'body-max-line-length': [RuleConfigSeverity.Disabled],
    'body-leading-blank': [RuleConfigSeverity.Warning, 'always'],
    'footer-max-line-length': [RuleConfigSeverity.Error, 'always', 120],
    'footer-leading-blank': [RuleConfigSeverity.Warning, 'always'],
  },
} satisfies UserConfig
