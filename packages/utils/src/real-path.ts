import { realpath, realpathSync } from 'node:fs'

/**
 * Resolves the real path of a given file or directory.
 */
export const realPath = async (path: string) =>
  new Promise<string>(resolve => {
    realpath.native(path, (error, resolvedPath) => {
      resolve(error ? path : resolvedPath)
    })
  })

/**
 * Resolves the real path of a given file or directory synchronously.
 */
const realPathSync = (path: string) => realpathSync.native(path)

realPath.sync = realPathSync
