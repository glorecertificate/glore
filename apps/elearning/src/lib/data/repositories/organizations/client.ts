import { createDatabase } from '../../supabase'
import { createRepositoryRunner, expectSingle } from '../utils'
import { organizationQuery } from './queries'
import { type Organization } from './types'

const run = createRepositoryRunner(createDatabase)

export const findOrganization = async (id: number): Promise<Organization> =>
  run(async database => {
    const result = await database.from('organizations').select(organizationQuery).eq('id', id).single()

    return expectSingle(result) as Organization
  })
