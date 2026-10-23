import 'server-only'

import { isNotNull, or, sql } from 'drizzle-orm'

import { db } from '@/db/client'
import { certificates } from '@/db/schema'
import { r2DeleteQuietly } from '@/lib/storage'

const snapshotLogo = sql<string | null>`${certificates.snapshot} #>> '{organization,logoUrl}'`
const snapshotSignature = sql<string | null>`${certificates.snapshot} #>> '{organization,signatureUrl}'`

export const listSnapshotAssetUrls = async () => {
  const rows = await db
    .selectDistinct({ logoUrl: snapshotLogo, signatureUrl: snapshotSignature })
    .from(certificates)
    .where(isNotNull(certificates.snapshot))
  return rows.flatMap(({ logoUrl, signatureUrl }) => [logoUrl ?? '', signatureUrl ?? ''].filter(Boolean))
}

const isSnapshotAsset = async (url: string) => {
  const [row] = await db
    .select({ id: certificates.id })
    .from(certificates)
    .where(or(sql`${snapshotLogo} = ${url}`, sql`${snapshotSignature} = ${url}`))
    .limit(1)
  return Boolean(row)
}

export const deleteOrganizationAsset = async (url: string) => {
  try {
    if (await isSnapshotAsset(url)) return
  } catch (error) {
    console.error('Failed to check the certificate snapshots, keeping the R2 object', error)
    return
  }
  await r2DeleteQuietly(url)
}
