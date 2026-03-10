'use server'

import 'server-only'

import { cache } from 'react'

import { eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { certificates } from '@/db/schema'

export const findCertificate = cache(
  async (id: number) =>
    await safeQuery(async () => {
      const cert = await db.query.certificates.findFirst({
        where: eq(certificates.id, id),
        with: { organization: true, reviewer: true },
      })
      if (!cert) throw new Error('Certificate not found')
      return cert
    })
)
