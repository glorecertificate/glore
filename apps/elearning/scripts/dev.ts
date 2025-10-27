import { execSync } from 'node:child_process'

import env from '@next/env'

env.loadEnvConfig('.')

execSync('./node_modules/.bin/next dev', { stdio: 'inherit' })
