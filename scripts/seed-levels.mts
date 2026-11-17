import { type PoolClient } from 'pg'

import { levelCourses, syncLevelDescriptions } from './content/levels.mts'
import { loadContent } from './content/load.mts'

export const seedLevelDescriptions = async (client: PoolClient) =>
  await syncLevelDescriptions(client, levelCourses(loadContent().content))
