#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const ARTIFACT = 'visual-baselines'
const SNAPSHOTS = 'e2e/__screenshots__'

const exec = (command: string, args: string[]) => execFileSync(command, args, { encoding: 'utf8' }).trim()

const download = (run: number, directory: string) => {
  try {
    execFileSync('gh', ['run', 'download', String(run), '--name', ARTIFACT, '--dir', directory], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

const main = () => {
  const branch = exec('git', ['branch', '--show-current'])
  const runs = JSON.parse(
    exec('gh', ['run', 'list', '--workflow', 'ci.yml', '--branch', branch, '--limit', '10', '--json', 'databaseId'])
  ) as { databaseId: number }[]
  const directory = mkdtempSync(join(tmpdir(), `${ARTIFACT}-`))
  const run = runs.find(({ databaseId }) => download(databaseId, directory))
  if (!run) {
    rmSync(directory, { force: true, recursive: true })
    console.error(`No CI run on ${branch} has a ${ARTIFACT} artifact.`)
    process.exit(1)
  }
  cpSync(directory, SNAPSHOTS, { recursive: true })
  rmSync(directory, { force: true, recursive: true })
  console.info(`Copied the baselines of run ${run.databaseId} to ${SNAPSHOTS}. Review the diff before you commit.`)
}

main()
