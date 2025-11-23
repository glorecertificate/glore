import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

import env from '@next/env'

const SUPABASE_ENV = 'supabase/functions/.env'

env.loadEnvConfig('.')

execSync(`dotenv -e ${resolve(SUPABASE_ENV)} -- lt --port ${process.env.PORT}`, {
  stdio: 'inherit',
})
