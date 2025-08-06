import { type Config as BaseConfig } from 'release-it'

import { type DEFAULT_PLUGINS } from './config'

interface Context {
  branchName: string
  changelog: string
  latestVersion: string
  name: string
  releaseUrl: string
  repo: {
    remote: string
    protocol: string
    host: string
    owner: string
    repository: string
    project: string
  }
  version: string
}

export type Plugins = {
  '@release-it/bumper'?: {
    out: string[]
  }
  '@release-it/conventional-changelog'?: {
    /** @default "# Changelog" */
    header?: string
    infile?: string
    ignoreRecommendedBump?: boolean
    preset: {
      name: 'conventionalcommits'
      issuePrefixes?: string[]
      issueUrlFormat?: string
      types?: Array<{
        section: string
        type: string
        scope?: string
        hidden?: boolean
      }>
    }
  }
  'release-it-pnpm'?: {
    publishCommand: string
  }
} & Record<string, Record<string, unknown>>

export interface Config extends Omit<BaseConfig, 'plugins'> {
  github?: BaseConfig['github'] & {
    releaseNotes?: (context: Context) => string
  }
  hooks?: BaseConfig['hooks'] & {
    [K in keyof typeof DEFAULT_PLUGINS as `${'before' | 'after'}:${K}:${'init' | 'bump' | 'release'}`]?:
      | string
      | string[]
      | ((context: Context) => string | string[])
  }
  plugins?: Plugins
}
