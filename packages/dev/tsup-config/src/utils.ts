import { TSUP_OPTIONS } from './config'
import { Options } from './types'

const { dts: defaultDts, ...defaultOptions } = TSUP_OPTIONS

export const mergeWithDefaults = (options: Options): Options => {
  const { dts: userDts, ...userOptions } = options
  const baseOptions = { ...defaultOptions, ...userOptions }
  const dts = mergeDts(options, userDts)
  return { ...baseOptions, dts }
}

export const mergeDts = (options: Options, dtsOptions: Options['dts']) => {
  if (typeof dtsOptions === 'undefined') return defaultDts
  if (typeof dtsOptions !== 'object') return dtsOptions

  const entry = dtsOptions.entry ?? options.entry

  return {
    ...defaultDts,
    ...dtsOptions,
    entry,
    compilerOptions: {
      ...defaultDts.compilerOptions,
      ...dtsOptions.compilerOptions,
    },
  }
}
