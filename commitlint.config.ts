import configConventional from '@commitlint/config-conventional'
import { RuleConfigSeverity, type UserConfig } from '@commitlint/types'

const COMMIT_SCOPES = ['release', 'deps', 'deps-dev', 'security'] as const

export type CommitType = keyof typeof configConventional.prompt.questions.type.enum
export type CommitScope = (typeof COMMIT_SCOPES)[number]

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [RuleConfigSeverity.Error, 'always', COMMIT_SCOPES],
    'subject-empty': [RuleConfigSeverity.Error, 'never'],
    'header-max-length': [RuleConfigSeverity.Error, 'always', 100],
    'body-max-line-length': [RuleConfigSeverity.Disabled],
    'body-leading-blank': [RuleConfigSeverity.Warning, 'always'],
    'footer-max-line-length': [RuleConfigSeverity.Error, 'always', 120],
    'footer-leading-blank': [RuleConfigSeverity.Warning, 'always'],
  },
} satisfies UserConfig
