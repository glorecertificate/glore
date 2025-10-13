import { execSync } from 'node:child_process'

execSync('pnpm run typegen', { stdio: 'ignore' })
execSync('./node_modules/.bin/dotenv -- ./node_modules/.bin/next build', { stdio: 'inherit' })
