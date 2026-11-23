import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..', '..')
const SPECS = join('.agents', 'specs')
const AGENTS_LIMIT = 2000
const SPEC_LIMIT = 4500

const estimateTokens = (text: string) => Math.round([...text.replaceAll(/ {2,}/gu, ' ')].length / 4)

const specs = (await readdir(join(ROOT, SPECS)))
  .filter(name => name.endsWith('.md'))
  .map(name => ({ file: join(SPECS, name), limit: SPEC_LIMIT }))

const results = await Promise.all(
  [{ file: 'AGENTS.md', limit: AGENTS_LIMIT }, ...specs].map(async ({ file, limit }) => ({
    file,
    limit,
    tokens: estimateTokens(await readFile(join(ROOT, file), 'utf8')),
  }))
)
const over = results.filter(({ limit, tokens }) => tokens >= limit)

if (over.length > 0) {
  for (const { file, limit, tokens } of over) console.error(`${file}: ${tokens} estimated tokens, limit ${limit}.`)
  console.error('Move detail into another spec or a reference, and never drop a fact (AGENTS.md, "Budget").')
  process.exit(1)
}
