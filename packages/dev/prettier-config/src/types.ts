import { type Config as PrettierConfig } from 'prettier'
import { SqlBaseOptions } from 'prettier-plugin-sql'

export type BaseOptions = PrettierConfig
export type SqlOptions = SqlBaseOptions

export interface Options extends BaseOptions {
  sql?: boolean | SqlOptions
}

export type Config = BaseOptions & SqlOptions
