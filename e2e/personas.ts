import { Pool } from 'pg'

import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'
import { demoUsername } from '~/scripts/seed-demo-data'

export const PERSONAS = ['volunteer', 'volunteer-progress', 'volunteer-review', 'volunteer-changes'] as const

export type Persona = (typeof PERSONAS)[number]

export const personaFile = (persona: Persona) => `.playwright/.auth/persona-${persona}.json`

export const personaUsername = (persona: Persona) => demoUsername(persona)

export const PERSONAS_MISSING = 'Seed the demo personas with pnpm run db:seed:demo --target local'

export const hasPersonas = async () => {
  const connectionString = process.env.DATABASE_URL
  if (!(connectionString && LOCAL_DATABASE_REGEX.test(connectionString))) return false
  const pool = new Pool({ connectionString })
  try {
    const { rowCount } = await pool.query('select 1 from users where username = any($1)', [
      PERSONAS.map(personaUsername),
    ])
    return rowCount === PERSONAS.length
  } finally {
    await pool.end()
  }
}
