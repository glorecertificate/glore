#!/usr/bin/env node

import { Pool } from 'pg'

import { buildCatalog } from './catalog.mts'
import { ENTITIES, type SyncStats, createStats, removeCourse, syncCatalog } from './sync.mts'
import { USAGE, guardTarget, parseImportArgs } from './target.mts'
import { checkContent, formatProblems } from './validate.mts'

const fail = (message: string): never => {
  console.error(message)
  process.exit(1)
}

const report = (stats: SyncStats) => {
  for (const entity of ENTITIES) {
    const { created, deleted, unchanged, updated } = stats[entity]
    console.info(
      `${entity.padEnd(12)} created ${created}, updated ${updated}, unchanged ${unchanged}, deleted ${deleted}`
    )
  }
  console.info(`Learner progress rows removed: ${stats.progressRowsRemoved}`)
}

const importContent = async () => {
  const parsed = parseImportArgs(process.argv.slice(2))
  if (!parsed.options) return fail(`${parsed.error}\n${USAGE}`)
  const { options } = parsed

  const guard = guardTarget(options, process.env.DATABASE_URL)
  if (guard.error) return fail(guard.error)
  if (guard.drafts && !options.drafts) console.info('Production target: importing as drafts.')

  const removing = options.remove.length > 0
  const { content, problems } = checkContent()
  if (!removing && problems.length > 0) {
    return fail(`${formatProblems(problems)}\n\nFix ${problems.length} problem(s) before importing.`)
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()
  let stats = createStats()

  try {
    await client.query('begin')
    if (removing) {
      for (const slug of options.remove) {
        console.info(`${(await removeCourse({ client, stats }, slug)) ? 'Removed' : 'Not found'}: ${slug}`)
      }
    }
    if (!removing) {
      stats = await syncCatalog(client, buildCatalog(content), { drafts: guard.drafts, examples: options.examples })
    }
    await client.query(options.dryRun ? 'rollback' : 'commit')
  } catch (e) {
    await client.query('rollback')
    throw e
  } finally {
    client.release()
    await pool.end()
  }

  console.info(
    options.dryRun
      ? 'Dry run: nothing was written.'
      : `${removing ? 'Removed courses from' : 'Imported into'} ${options.target}.`
  )
  report(stats)
}

if (import.meta.main) await importContent()
