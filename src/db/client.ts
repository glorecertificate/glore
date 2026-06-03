import 'server-only'

import { neon } from '@neondatabase/serverless'
import { type NeonHttpDatabase, drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from '@/db/schema'

const DATABASE_URL = process.env.DATABASE_URL

export const db = (
  /@(localhost|127\.0\.0\.1)(:|\/)/u.test(DATABASE_URL)
    ? drizzlePg({
        client: new Pool({
          connectionString: DATABASE_URL,
          max: 5,
        }),
        schema,
        casing: 'snake_case',
      })
    : drizzleNeon({
        client: neon(DATABASE_URL),
        schema,
        casing: 'snake_case',
      })
) as NeonHttpDatabase<typeof schema>
