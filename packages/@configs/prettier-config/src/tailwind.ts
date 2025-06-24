import { type Config } from 'prettier'
import { type PluginOptions } from 'prettier-plugin-tailwindcss'

import prettierConfig from './base'

const { plugins = [], ...options } = prettierConfig

const tailwindOptions: PluginOptions = {
  tailwindFunctions: ['cn', 'cva', 'tw'],
  tailwindStylesheet: './src/app/globals.css',
}

const prettierConfigTailwind: Config = {
  ...options,
  plugins: [...plugins, 'prettier-plugin-tailwindcss'],
  ...tailwindOptions,
}

export default prettierConfigTailwind
