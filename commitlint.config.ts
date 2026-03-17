import { RuleConfigSeverity, type UserConfig } from '@commitlint/types'

const { Error, Warning, Disabled } = RuleConfigSeverity

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      Error,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert', 'ai'],
    ],
    'scope-enum': [Error, 'always', ['deps', 'deps-dev', 'release', 'security']],
    'subject-case': [Error, 'always', 'sentence-case'],
    'subject-empty': [Error, 'never'],
    'header-max-length': [Error, 'always', 100],
    'body-max-line-length': [Disabled],
    'body-leading-blank': [Warning, 'always'],
    'footer-max-line-length': [Error, 'always', 120],
    'footer-leading-blank': [Warning, 'always'],
  },
} satisfies UserConfig
