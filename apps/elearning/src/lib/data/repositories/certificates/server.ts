import { getDatabase } from '../../supabase/server'
import { createRepositoryRunner, expectSingle } from '../utils'
import { certificateQuery } from './queries'
import { parseCertificate } from './utils'

const run = createRepositoryRunner(getDatabase)

export const findCertificate = async (id: number | string) =>
  run(async database => {
    const result = await database.from('certificates').select(certificateQuery).eq('id', Number(id)).single()
    return parseCertificate(expectSingle(result))
  })
