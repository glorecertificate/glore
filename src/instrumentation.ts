import { schema } from '@/lib/env'

export const register = () => {
  schema.parse(process.env)
}
