/**
 * Simple logging utility supporting error and warn methods.
 */
/* eslint-disable no-console */
export const log = Object.assign(
  (...data: any[]) => {
    console.log(...data)
  },
  {
    error: (...data: any[]) => console.error('\x1b[31m✖︎\x1b[0m', ...data),
    info: (...data: any[]) => console.log('\x1b[34mℹ︎\x1b[0m', ...data),
    success: (...data: any[]) => console.log('\x1b[32m✔︎\x1b[0m', ...data),
    warn: (...data: any[]) => console.warn('\x1b[33m⚠︎\x1b[0m', ...data),
  },
)

export default log
