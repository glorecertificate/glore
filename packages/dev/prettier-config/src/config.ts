import { BaseOptions, SqlOptions } from './types'

export const BASE_OPTIONS: BaseOptions = {
  arrowParens: 'avoid',
  printWidth: 120,
  quoteProps: 'as-needed',
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  plugins: [],
  overrides: [
    {
      files: ['*.css'],
      options: {
        singleQuote: false,
      },
    },
    {
      files: ['*.json'],
      options: {
        printWidth: 100,
        singleQuote: false,
        trailingComma: 'none',
      },
    },
    {
      files: ['*.yml', '*.yaml'],
      options: {
        printWidth: 100,
      },
    },
    {
      files: ['.github/workflows/*.yml'],
      options: {
        printWidth: 100,
        singleQuote: true,
      },
    },
    {
      files: ['.vscode/*.json'],
      options: {
        printWidth: 200,
      },
    },
    {
      files: ['*.xml'],
      options: {
        printWidth: 100,
        singleQuote: false,
        trailingComma: 'none',
      },
    },
  ],
}

export const SQL_OPTIONS: SqlOptions = {
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
