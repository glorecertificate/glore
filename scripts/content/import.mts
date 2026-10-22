#!/usr/bin/env node

import { Pool } from 'pg'

import { buildCatalog } from './catalog.mts'
import { buildDocCatalog } from './docs.mts'
import { DOC_ENTITIES, type DocStats, createDocStats, syncDocs } from './sync-docs.mts'
import { type Counter, ENTITIES, type SyncStats, createStats, removeCourse, syncCatalog } from './sync.mts'
import { USAGE, guardTarget, parseImportArgs } from './target.mts'
import { checkContent, formatProblems } from './validate.mts'

const fail = (message: string): never => {
  console.error(message)
  process.exit(1)
}

const line = (entity: string, { created, deleted, unchanged, updated }: Counter) =>
  `${entity.padEnd(14)} created ${created}, updated ${updated}, unchanged ${unchanged}, deleted ${deleted}`

const report = (stats: SyncStats, docStats: DocStats) => {
  for (const entity of ENTITIES) console.info(line(entity, stats[entity]))
  for (const entity of DOC_ENTITIES) console.info(line(entity, docStats[entity]))
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
  const { content, docs, problems } = checkContent()
  if (!removing && problems.length > 0) {
    return fail(`${formatProblems(problems)}\n\nFix ${problems.length} problem(s) before importing.`)
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()
  let stats = createStats()
  let docStats = createDocStats()

  try {
    await client.query('begin')
    if (removing) {
      for (const slug of options.remove) {
        console.info(`${(await removeCourse({ client, stats }, slug)) ? 'Removed' : 'Not found'}: ${slug}`)
      }
    }
    if (!removing) {
      stats = await syncCatalog(client, buildCatalog(content), { drafts: guard.drafts, examples: options.examples })
      docStats = await syncDocs(client, buildDocCatalog(docs), { drafts: guard.drafts })
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
  report(stats, docStats)
}

if (import.meta.main) await importContent()
