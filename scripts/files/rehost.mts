#!/usr/bin/env node

import { Pool } from 'pg'

import { USAGE, parseRehostArgs } from './plan.mts'
import { rehostFiles } from './run.mts'

const fail = (message: string): never => {
  console.error(message)
  process.exit(1)
}

const main = async () => {
  const parsed = parseRehostArgs(process.argv.slice(2))
  if (!parsed.options) return fail(`${parsed.error}\n${USAGE}`)
  const { apply, from, to } = parsed.options
  const host = URL.parse(process.env.DATABASE_URL ?? '')?.hostname
  if (!host) return fail('DATABASE_URL is missing or not a URL.')

  console.info(`${apply ? 'Rewriting' : 'Dry run on'} ${host}: ${from}/ to ${to}/`)
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()

  try {
    const { columns, matches } = await rehostFiles(client, parsed.options)
    for (const { column, count, table } of matches) console.info(`${table}.${column}: ${count} row(s)`)
    const total = matches.reduce((sum, { count }) => sum + count, 0)
    console.info(`${apply ? 'Rewrote' : 'Found'} ${total} row(s) in ${columns} text column(s).`)
    if (!apply && total > 0) console.info('Run again with --apply to rewrite them.')
    if (apply) console.info('Run the dry run again: it must find 0 rows.')
  } finally {
    client.release()
    await pool.end()
  }
}

await main()
