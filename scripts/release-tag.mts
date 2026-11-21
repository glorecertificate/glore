import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(execFile)

const run = async (command: string, args: string[]) =>
  (await exec(command, args, { maxBuffer: 16 * 1024 * 1024 })).stdout.trim()

const git = async (...args: string[]) => await run('git', args)

const sectionOf = (changelog: string, version: string) => {
  const heading = `## [${version}]`
  const start = changelog.indexOf(heading)
  if (start === -1) throw new Error(`CHANGELOG.md has no ${heading} section.`)
  const body = changelog.slice(changelog.indexOf('\n', start) + 1)
  const end = body.indexOf('\n## [')
  return (end === -1 ? body : body.slice(0, end)).trim()
}

await git('fetch', 'origin', 'main', '--tags')

const { version } = JSON.parse(await git('show', 'origin/main:package.json')) as { version: string }
const tag = `v${version}`
const subject = await git('log', '-1', '--format=%s', 'origin/main')

if (!subject.startsWith(`chore(release): ${tag}`)) {
  throw new Error(`The last commit on origin/main is "${subject}", not the ${tag} release.`)
}

if (await git('tag', '--list', tag)) throw new Error(`The tag ${tag} already exists.`)

const notes = sectionOf(await git('show', 'origin/main:CHANGELOG.md'), version)

await git('tag', '--annotate', tag, '--message', tag, 'origin/main')
await git('push', 'origin', tag)
await run('gh', ['release', 'create', tag, '--title', tag, '--notes', notes, '--verify-tag'])

console.info(`Pushed ${tag}. The Release workflow deploys it to production.`)
