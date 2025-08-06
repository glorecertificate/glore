import { defineConfig } from '@repo/release-config'

export default defineConfig({
  hooks: {
    'after:init': '[ -n "$(git log @{u}..)" ] && [ "$SKIP_CI" != 1 ] && pnpm build && pnpm run check || exit 0',
    'before:release': 'pnpm run format && git add .',
  },
  plugins: {
    '@release-it/bumper': {
      out: ['./apps/elearning/config/metadata.json'],
    },
  },
})
