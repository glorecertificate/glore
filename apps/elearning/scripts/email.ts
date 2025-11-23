import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

import env from '@next/env'

const TEMPLATE_DIR = 'src/lib/services/mailer/templates'

env.loadEnvConfig('.')

execSync(`email dev --port ${process.env.EMAIL_PORT} --dir ${resolve(TEMPLATE_DIR)}`, {
  stdio: 'inherit',
})
