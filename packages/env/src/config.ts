import { config } from 'dotenv'
import { expand } from 'dotenv-expand'

const ROOT_ENV = '../../.env'

// @ts-expect-error - EdgeRuntime is only defined in Next.js
if (typeof EdgeRuntime === 'undefined') {
  expand(config({ path: ROOT_ENV, quiet: true }))
}
