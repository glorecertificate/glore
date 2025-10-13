import z from 'zod'

export const defineEnv = <T extends z.ZodObject>(schema: T) => {
  const env = schema.safeParse(process.env)

  if (env.success) return env.data

  console.error('❌ Invalid environment variables')

  for (const [key, value] of Object.entries(z.treeifyError(env.error).properties ?? {})) {
    const keyError = [key]
    if (value?.errors.length) keyError.push(value.errors.join(', '))
    console.error(`${keyError.join(': ')}`)
  }

  process.exit(1)
}
