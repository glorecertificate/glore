import { type Config } from 'prettier'
import { type SqlBaseOptions } from 'prettier-plugin-sql'

import prettierConfig from './base'

const { plugins = [], ...options } = prettierConfig

const sqlOptions: SqlBaseOptions = {
  dataTypeCase: 'upper',
  expressionWidth: 80,
  functionCase: 'upper',
  identifierCase: 'lower',
  indentStyle: 'standard',
  keywordCase: 'upper',
  language: 'postgresql',
  linesBetweenQueries: 1,
  logicalOperatorNewline: 'after',
}

const prettierConfigSql: Config = {
  ...options,
  plugins: [...plugins, 'prettier-plugin-sql'],
  ...sqlOptions,
}

export default prettierConfigSql
