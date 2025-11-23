import { createParser } from '../utils'
import { type organizationQuery } from './queries'
import { type Organization } from './types'

export const parseOrganization = createParser<'organizations', typeof organizationQuery, Organization>(record => ({
  ...record,
  shortName: record.name.slice(0, 2).toUpperCase(),
}))
