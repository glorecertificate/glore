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
const header = `chore(release): ${tag}`
const log = await git('log', '--format=%H %s', 'origin/main')
const commit = log
  .split('\n')
  .map(line => ({ sha: line.slice(0, 40), subject: line.slice(41) }))
  .find(({ subject }) => subject === header || subject.startsWith(`${header} `))?.sha

if (!commit) throw new Error(`origin/main has no ${tag} release commit.`)

if (await git('tag', '--list', tag)) throw new Error(`The tag ${tag} already exists.`)

const promotedSha = async (query: string) =>
  await run('gh', [
    'api',
    `repos/{owner}/{repo}/deployments?environment=preview&task=promote&per_page=1${query}`,
    '--jq',
    '.[0].sha // ""',
  ])

const [promoted, current] = await Promise.all([promotedSha(`&sha=${commit}`), promotedSha('')])
if (!(promoted && current)) throw new Error(`Promote ${commit} to the preview first.`)
await git('merge-base', '--is-ancestor', commit, current)

const notes = sectionOf(await git('show', `${commit}:CHANGELOG.md`), version)

await git('tag', '--annotate', tag, '--message', tag, commit)
await git('push', 'origin', tag)
await run('gh', ['release', 'create', tag, '--title', tag, '--notes', notes, '--verify-tag'])

console.info(`Pushed ${tag}. The Release workflow deploys it to production.`)
