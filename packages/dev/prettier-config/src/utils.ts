import sqlPlugin from 'prettier-plugin-sql'

import { deepmerge } from 'deepmerge-ts'

import { BASE_OPTIONS, SQL_OPTIONS } from './config'
import { BaseOptions, Options, SqlOptions } from './types'

export const mergeOptions = <T>(base: T, custom?: T | boolean): Exclude<T, boolean> | {} =>
  custom ? (typeof custom === 'object' ? deepmerge(base, custom) : base) : {}

export const optionsAsObject = <T>(options: T | boolean): Exclude<T, boolean> | {} =>
  typeof options === 'object' ? options : {}

export const createConfig = (options: Options = {}): Options => {
  const { sql, ...userOptions } = options
  const base = mergeOptions(BASE_OPTIONS, userOptions) as Required<BaseOptions>
  if (!sql) return base
  base.plugins.push(sqlPlugin)
  return { ...base, ...mergeOptions(SQL_OPTIONS, optionsAsObject(sql)) }
}
