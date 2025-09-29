import { dirname, join } from 'node:path'

import { findUp } from './find-up'
import { realPath } from './real-path'

const WORKSPACE_DIR_ENV = 'NPM_CONFIG_WORKSPACE_DIR'
const WORKSPACE_MANIFEST = 'pnpm-workspace.yaml'

/**
 * Returns the workspace root directory in a pnpm environment.
 */
export const pnpmRoot = async (
  /**
   * The current working directory.
   *
   * @default process.cwd()
   */
  cwd = process.cwd(),
) => {
  const manifestEnv = process.env[WORKSPACE_DIR_ENV] ?? process.env[WORKSPACE_DIR_ENV.toLowerCase()]

  const manifestPath = manifestEnv
    ? join(manifestEnv, WORKSPACE_MANIFEST)
    : await findUp(WORKSPACE_MANIFEST, { cwd: await realPath(cwd) })

  return manifestPath ? dirname(manifestPath) : undefined
}

/**
 * Synchronously returns the workspace root directory in a pnpm environment.
 */
pnpmRoot.sync = (
  /**
   * The current working directory.
   *
   * @default process.cwd()
   */
  cwd = process.cwd(),
) => {
  const manifestEnv = process.env[WORKSPACE_DIR_ENV] ?? process.env[WORKSPACE_DIR_ENV.toLowerCase()]

  const manifestPath = manifestEnv
    ? join(manifestEnv, WORKSPACE_MANIFEST)
    : findUp.sync(WORKSPACE_MANIFEST, { cwd: realPath.sync(cwd) })

  return manifestPath ? dirname(manifestPath) : undefined
}
