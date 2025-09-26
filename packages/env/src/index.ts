export type EnvRecord = {
  NODE_ENV?: 'development' | 'production' | 'test'
  [key: string]: boolean | string | number | undefined
}

export class EnvError extends Error {
  constructor(variable: string) {
    super(`Missing environment variable: ${variable}`)
    this.name = 'EnvError'
  }
}

export const defineEnv = <T extends EnvRecord>(env: T) => {
  // @ts-expect-error - EdgeRuntime is only defined in Next.js
  if (typeof EdgeRuntime !== 'undefined')
    return env as { [K in keyof T]: T[K] extends undefined ? string : Exclude<T[K], undefined> }

  void (async () => {
    await import('./config')

    for (const [key, value] of Object.entries(env)) {
      if (typeof window !== 'undefined' && !key.startsWith('NEXT_PUBLIC_')) continue
      if (!value) throw new EnvError(key)
    }
  })()

  return env as { [K in keyof T]: T[K] extends undefined ? string : Exclude<T[K], undefined> }
}
