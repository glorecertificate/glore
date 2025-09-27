import { statSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { dirname, isAbsolute, join, parse, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const toPath = (urlOrPath: string | URL) => (urlOrPath instanceof URL ? fileURLToPath(urlOrPath) : urlOrPath)

export interface FindUpOptions {
  /**
   * The directory to start from.
   *
   * @default process.cwd()
   */
  readonly cwd?: URL | string
  /**
   * Directory path where the search halts if no matches are found before reaching this point.
   *
   * @default The root directory
   */
  readonly stopAt?: URL | string
  /**
   * The type of path to match.
   * @default 'file'
   */
  readonly type?: 'file' | 'directory'
}

/**
 * Finds a file or directory by walking up parent directories.
 *
 * @param name - The name of the file or directory to find.
 * @returns The found path or `undefined` if it could not be found.
 *
 * @example
 * ```ts
 * // / (root)
 * // └── Users
 * //     └── username
 * //         ├── image.png
 * //         └── foo
 * //             └── bar
 * //                 ├── baz
 * //                 └── example.js
 *
 * // example.js
 * console.log(await findUp('unicorn.png')) // => /Users/username/unicorn.png
 * ```
 */
export const findUp = async (name: string, { cwd = process.cwd(), stopAt, type = 'file' }: FindUpOptions = {}) => {
  let directory = resolve(toPath(cwd) ?? '')
  const { root } = parse(directory)
  stopAt = resolve(directory, toPath(stopAt ?? root))
  const isAbsoluteName = isAbsolute(name)

  while (directory) {
    const filePath = isAbsoluteName ? name : join(directory, name)

    try {
      const stats = await stat(filePath)

      if ((type === 'file' && stats.isFile()) || (type === 'directory' && stats.isDirectory())) {
        return filePath
      }
    } catch {
      /**/
    }

    if (directory === stopAt || directory === root) break
    directory = dirname(directory)
  }
}

/**
 * Finds a file or directory by walking up parent directories.
 *
 * @param name - The name of the file or directory to find.
 * @returns The found path or `undefined` if it could not be found.
 *
 * @example
 * ```ts
 * // / (root)
 * // └── Users
 * //     └── username
 * //         ├── image.png
 * //         └── foo
 * //             └── bar
 * //                 ├── baz
 * //                 └── example.js
 *
 * // example.js
 * console.log(await findUpSync('unicorn.png')) // => /Users/username/unicorn.png
 * ```
 */
const findUpSync = (name: string, { cwd = process.cwd(), stopAt, type = 'file' }: FindUpOptions = {}) => {
  let directory = resolve(toPath(cwd) ?? '')
  const { root } = parse(directory)
  stopAt = resolve(directory, toPath(stopAt ?? root))
  const isAbsoluteName = isAbsolute(name)

  while (directory) {
    const filePath = isAbsoluteName ? name : join(directory, name)

    try {
      const stats = statSync(filePath, { throwIfNoEntry: false })
      if ((type === 'file' && stats?.isFile()) || (type === 'directory' && stats?.isDirectory())) {
        return filePath
      }
    } catch {
      /**/
    }

    if (directory === stopAt || directory === root) break
    directory = dirname(directory)
  }
}

findUp.sync = findUpSync
