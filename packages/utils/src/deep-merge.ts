import { type AnyRecord } from './types'

/**
 * Deep merges a target object with one or more source objects.
 */
export const deepMerge = <P extends AnyRecord>(target: P, ...sources: P[]): P => {
  if (!sources.length) return target

  for (const [key, v] of Object.entries(sources.shift() ?? [])) {
    const value = v as AnyRecord

    if (!value) continue

    if (!target[key]) {
      Object.assign(target, { [key]: {} })
      continue
    }

    if (
      value.constructor === Object ||
      (value.constructor === Array && (value as P[]).find(v => v.constructor === Object))
    ) {
      deepMerge(target[key], value)
      continue
    }

    if (value.constructor === Array) {
      Object.assign(target, {
        [key]: (value as P[]).find(v => v.constructor === Array)
          ? (target[key] as P[]).concat(value)
          : [...new Set([...(target[key] as P[]), ...value])],
      })
      continue
    }

    Object.assign(target, { [key]: value })
  }

  return target
}
