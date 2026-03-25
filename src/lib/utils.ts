import { cx } from 'class-variance-authority'
import { type ClassValue } from 'class-variance-authority/types'
import { type FieldValues, type UseFormReturn } from 'react-hook-form'
import { extendTailwindMerge } from 'tailwind-merge'

import { CAMEL_CASE_REGEX, EMAIL_REGEX, USERNAME_REGEX } from '@/lib/constants'
import { type Any, type AnyFunction, type AnyRecord, type CamelCase, type Rgb } from '@/lib/types'

/*
  App
*/
export const publicFile = (file: PublicFile) => `${process.env.APP_URL ?? ''}${file}`

/*
  Theme
*/
const twMerge = extendTailwindMerge<'text-stroke-width' | 'text-stroke-color'>({
  extend: {
    classGroups: {
      'text-stroke-color': [{ 'text-stroke': [(n: string) => !Number(n)] }],
      'text-stroke-width': [{ 'text-stroke': [(n: string) => Number(n) > 0] }],
    },
  },
})

export const cn = (...inputs: ClassValue[]) => twMerge(cx(inputs))

export const hexToRgb = <T extends AnyRecord>(record: T) =>
  Object.entries(record).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key as keyof T]: [
        parseInt(value.slice(1, 3), 16),
        parseInt(value.slice(3, 5), 16),
        parseInt(value.slice(5, 7), 16),
      ] as Rgb,
    }),
    {} as { [K in keyof T]: Rgb }
  )

/*
  Validation
*/
export const isValidUsername = (value: string) => EMAIL_REGEX.test(value) || USERNAME_REGEX.test(value)

export const defaultFormDisabled = <T extends FieldValues>({ formState }: UseFormReturn<T>) =>
  !formState.isDirty || Object.keys(formState.errors).length > 0

/*
  Strings
*/
export const titleize = (input: string) =>
  input
    .split(' ')
    .map(word => (word.length > 3 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase()))
    .join(' ')

export const camelize = <T extends string>(input: T) =>
  input
    .split(CAMEL_CASE_REGEX)
    .filter(Boolean)
    .map((word, index) => {
      const cleanWord = word.toLowerCase()
      return index === 0 ? cleanWord : cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1)
    })
    .join('') as CamelCase<T>

/*
  Objects
*/
export const keysOf = <T extends AnyRecord>(record: T) => Object.keys(record) as (keyof T)[]

export const pluck = <T extends AnyRecord, K extends keyof T>(array: T[], key: K): T[K][] =>
  array.map(item => item[key])

export const omit = <T extends AnyRecord, K extends keyof T>(record: T, keys: K | K[]) => {
  const object = { ...record }
  for (const key of [keys].flat()) {
    if (key in object) {
      delete object[key]
    }
  }
  return object
}

/*
  Functions
*/
export const debounce = <T extends unknown[]>(callback: (...args: T) => void, delay = 500) => {
  let timer: NodeJS.Timeout
  let lastArgs: T | null = null
  const debounced = (...args: T) => {
    lastArgs = args
    clearTimeout(timer)
    timer = setTimeout(() => {
      lastArgs = null
      callback(...args)
    }, delay)
  }
  debounced.cancel = () => {
    clearTimeout(timer)
    lastArgs = null
  }
  debounced.flush = () => {
    if (!lastArgs) return
    clearTimeout(timer)
    const args = lastArgs
    lastArgs = null
    callback(...args)
  }
  return debounced
}

export const throttle = <F extends AnyFunction>(callback: F, limit: number): F => {
  let throttling: boolean
  let timeout: ReturnType<typeof setTimeout>
  let timestamp: number
  return function throttled(this: Any, ...args: Any[]) {
    if (!throttling) {
      callback.apply(this, args)
      timestamp = Date.now()
      throttling = true
      return
    }
    clearTimeout(timeout)
    timeout = setTimeout(
      () => {
        if (Date.now() - timestamp < limit) return
        callback.apply(this, args)
        timestamp = Date.now()
      },
      limit - (Date.now() - timestamp)
    )
  } as F
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const noop = () => {}
