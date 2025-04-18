import { resolve } from 'node:path'

import tsupConfig from '@repo/tsup-config'

export default tsupConfig({
  publicDir: resolve(__dirname, 'src'),
})
