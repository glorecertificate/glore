import 'prettier-plugin-sql'

import { SqlOptions } from '../types'
import { createConfig } from '../utils'

export const sqlConfig = (options?: SqlOptions) => createConfig({ sql: options })
export default sqlConfig()
