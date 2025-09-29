import { createConfig } from './utils'

const prettierConfig = createConfig()

export default prettierConfig
export { createConfig }
export { sqlConfig } from './configs/sql'
export type * from './types'
