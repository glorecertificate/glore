import { type PoolClient } from 'pg'

import { COLUMNS_SQL, COLUMN_TYPES, type RehostOptions, type TextColumn, countSql, updateSql } from './plan.mts'

export interface RehostMatch {
  column: string
  count: number
  table: string
}

export const rehostFiles = async (client: PoolClient, { apply, from, to }: RehostOptions) => {
  await client.query('begin')
  try {
    const { rows: columns } = await client.query<TextColumn>(COLUMNS_SQL, [COLUMN_TYPES])
    const matches: RehostMatch[] = []
    for (const column of columns) {
      const { rows } = await client.query<{ count: number }>(countSql(column), [`${from}/`])
      const count = rows[0]?.count ?? 0
      if (count === 0) continue
      if (apply) await client.query(updateSql(column), [`${from}/`, `${to}/`])
      matches.push({ column: column.column, count, table: column.table })
    }
    await client.query(apply ? 'commit' : 'rollback')
    return { columns: columns.length, matches }
  } catch (error) {
    await client.query('rollback')
    throw error
  }
}
