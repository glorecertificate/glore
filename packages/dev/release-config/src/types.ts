import { type Config } from 'release-it'

import { type RELEASE_PLUGINS } from './config'

export interface Context {
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
      types?: {
        section: string
        type: string
        scope?: string
        hidden?: boolean
      }[]
    }
  }
} & Record<string, Record<string, unknown>>

export interface Options extends Omit<Config, 'plugins'> {
  github?: Config['github'] & {
    releaseNotes?: (context: Context) => string
  }
  hooks?: Config['hooks'] & {
    [K in keyof typeof RELEASE_PLUGINS as `${'before' | 'after'}:${K}:${'init' | 'bump' | 'release'}`]?:
      | string
      | string[]
      | ((context: Context) => string | string[])
  }
  plugins?: Plugins
}
