import { type Config as ReleaseItConfig } from 'release-it'

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

export interface Config extends ReleaseItConfig {
  github: ReleaseItConfig['github'] & {
    releaseNotes?: (context: Context) => string
  }
}

export interface JointConfig {
  afterInit?: string | string[]
  afterBump?: string | string[]
  afterRelease?: string | string[]
  /** @default true */
  autoReleaseNotes?: boolean
  bumpFiles?: string[]
  /** @default true */
  changelog?: boolean
  /** @default false */
  deployments?: boolean
}
