import './lib/dotenv'

import { GlobalEnv } from './lib/schema'
import { defineEnv } from './lib/utils'

export const Env = defineEnv(GlobalEnv)

declare global {
  namespace NodeJS {
    interface ProcessEnv extends GlobalEnv {}
  }
}
