import { config } from 'dotenv'
import { expand } from 'dotenv-expand'

const ROOT_ENV = '../../.env'

expand(
  config({
    path: ROOT_ENV,
    quiet: true,
  })
)
