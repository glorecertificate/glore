import { defineConfig } from 'drizzle-kit'

const drizzleConfig = defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema',
  out: './drizzle',
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
})

export default drizzleConfig
