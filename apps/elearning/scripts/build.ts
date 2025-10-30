import { execSync } from 'node:child_process'

execSync('pnpm run typegen')
execSync('./node_modules/.bin/next build', { stdio: 'inherit' })
