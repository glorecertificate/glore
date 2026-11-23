import { parseArgs } from 'node:util'

export interface RehostOptions {
  apply: boolean
  from: string
  to: string
}

export interface TextColumn {
  column: string
  table: string
  type: string
}

export const USAGE = 'Usage: pnpm run files:rehost --from <old public URL> --to <new public URL> [--apply]'

export const COLUMN_TYPES = ['text', 'character varying', 'json', 'jsonb', 'text[]', 'character varying[]']

export const COLUMNS_SQL = `select c.relname as "table", a.attname as "column", format_type(a.atttypid, null) as "type"
from pg_attribute a
join pg_class c on c.oid = a.attrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and a.attnum > 0
  and not a.attisdropped
  and a.attgenerated = ''
  and format_type(a.atttypid, null) = any($1::text[])
order by c.relname, a.attname`

const UNSAFE_CHARACTERS = /[\s"'\\,{}]/u

export const normalizePrefix = (value: string | undefined) => {
  if (!value || UNSAFE_CHARACTERS.test(value)) return null
  const url = URL.parse(value)
  if (!url || !['http:', 'https:'].includes(url.protocol)) return null
  if (url.search || url.hash || url.username || url.password) return null
  return `${url.origin}${url.pathname.replace(/\/+$/u, '')}`
}

export const parseRehostArgs = (argv: string[]) => {
  try {
    const { values } = parseArgs({
      args: argv,
      options: {
        apply: { type: 'boolean' },
        from: { type: 'string' },
        to: { type: 'string' },
      },
      strict: true,
    })
    const from = normalizePrefix(values.from)
    const to = normalizePrefix(values.to)
    if (!from || !to) return { error: '--from and --to must be http or https URLs with no query, hash, or quotes' }
    if (from === to) return { error: '--from and --to must differ' }
    if (`${to}/`.startsWith(`${from}/`)) return { error: '--to must not be a path under --from' }
    const options: RehostOptions = { apply: values.apply ?? false, from, to }
    return { options }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

const quote = (name: string) => `"${name.replaceAll('"', '""')}"`

const target = ({ column, table }: TextColumn) => ({ column: quote(column), table: quote(table) })

export const countSql = (textColumn: TextColumn) => {
  const { column, table } = target(textColumn)
  return `select count(*)::int as "count" from ${table} where strpos(${column}::text, $1) > 0`
}

export const updateSql = (textColumn: TextColumn) => {
  const { column, table } = target(textColumn)
  return `update ${table} set ${column} = replace(${column}::text, $1, $2)::${textColumn.type} where strpos(${column}::text, $1) > 0`
}
