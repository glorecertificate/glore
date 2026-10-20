import { existsSync, readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'

import { defineConfig } from 'vitest/config'

const env = ['.env', '.env.local']
  .filter(file => existsSync(file))
  .reduce((acc, file) => ({ ...acc, ...parseEnv(readFileSync(file, 'utf8')) }), {}) as Partial<NodeJS.ProcessEnv>

const vitestConfig = defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      'server-only': 'next/dist/compiled/server-only/empty.js',
    },
  },
  test: {
    environment: 'node',
    env,
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    restoreMocks: true,
    unstubEnvs: true,
  },
})

export default vitestConfig
