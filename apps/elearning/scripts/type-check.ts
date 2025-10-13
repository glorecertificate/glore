import { execSync } from 'node:child_process'

const PROJECT = 'tsconfig.json'
const BUILD_PROJECT = 'tsconfig.build.json'

execSync(`tsc -p ${process.env.NODE_ENV === 'production' ? BUILD_PROJECT : PROJECT} --noEmit`, { stdio: 'inherit' })
