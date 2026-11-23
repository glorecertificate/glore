import { randomUUID } from 'node:crypto'

import { Pool, type PoolClient } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

import { type RehostMatch, rehostFiles } from './run.mts'

interface ProbeRow {
  doc: { image: string; nested: { src: string }[] } | null
  id: number
  list: string[] | null
  raw: { src: string } | null
  short: string | null
  url: string | null
}

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

const suffix = randomUUID().slice(0, 8)
const table = `rehost_probe_${suffix}`
const from = `https://old-${suffix}.r2.dev`
const to = `https://cdn-${suffix}.glore.test`
const OTHER = 'https://other.test/a.png'

describe.skipIf(!isLocalDatabase)('rehostFiles', () => {
  let pool: Pool
  let client: PoolClient

  const row = async (id: number) =>
    (await client.query<ProbeRow>(`select * from "${table}" where id = $1`, [id])).rows[0]

  const probe = (matches: RehostMatch[]) => matches.filter(match => match.table === table)

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL })
    client = await pool.connect()
    await client.query(
      `create table "${table}" (id int primary key, doc jsonb, list text[], raw json, short varchar(60), url text)`
    )
    await client.query(`insert into "${table}" values ($1, $2, $3, $4, $5, $6), (2, null, null, null, null, $7)`, [
      1,
      JSON.stringify({ image: `${from}/lessons/1.png`, nested: [{ src: `${from}/lessons/2.png` }] }),
      [`${from}/a.png`, OTHER],
      JSON.stringify({ src: `${from}/docs/1.png` }),
      `${from}/s.png`,
      `${from}/avatars/1.png`,
      OTHER,
    ])
  })

  afterAll(async () => {
    await client.query(`drop table if exists "${table}"`)
    client.release()
    await pool.end()
  })

  it('counts every matching column in a dry run and changes nothing', async () => {
    const { matches } = await rehostFiles(client, { apply: false, from, to })
    expect(probe(matches)).toEqual(['doc', 'list', 'raw', 'short', 'url'].map(column => ({ column, count: 1, table })))
    expect((await row(1))?.url).toBe(`${from}/avatars/1.png`)
  })

  it('rolls back every column when a new URL does not fit a varchar column', async () => {
    const long = `https://${'x'.repeat(60)}.test`
    await expect(rehostFiles(client, { apply: true, from, to: long })).rejects.toThrow(/too long/u)
    expect((await row(1))?.doc?.image).toBe(`${from}/lessons/1.png`)
  })

  it('rewrites text, JSON, and array columns and keeps other URLs', async () => {
    await rehostFiles(client, { apply: true, from, to })
    expect(await row(1)).toEqual({
      doc: { image: `${to}/lessons/1.png`, nested: [{ src: `${to}/lessons/2.png` }] },
      id: 1,
      list: [`${to}/a.png`, OTHER],
      raw: { src: `${to}/docs/1.png` },
      short: `${to}/s.png`,
      url: `${to}/avatars/1.png`,
    })
    expect((await row(2))?.url).toBe(OTHER)
    expect(probe((await rehostFiles(client, { apply: false, from, to })).matches)).toEqual([])
  })
})
