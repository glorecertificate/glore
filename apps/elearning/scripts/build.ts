import { execSync } from 'node:child_process'

// import './typegen'

execSync('next build --turbo', { stdio: 'inherit' })
