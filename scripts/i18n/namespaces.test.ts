import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { checkNamespaces, namespaceUsage } from './namespaces.mts'

const roots: string[] = []

const project = (files: Record<string, string>) => {
  const root = mkdtempSync(join(tmpdir(), 'namespaces-'))
  roots.push(root)
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true })
    writeFileSync(join(root, path), content)
  }
  return root
}

const NAMESPACES = ['Email', 'Panel', 'Shared']

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { force: true, recursive: true })
})

describe('namespaceUsage', () => {
  it('follows imports from client modules and stops at server actions', () => {
    const root = project({
      'src/actions/send.ts':
        "'use server'\nimport { render } from '@/emails/render'\nexport const send = () => render()\n",
      'src/components/panel.tsx':
        "'use client'\nimport { helper } from './helper'\nimport { send } from '@/actions/send'\nuseTranslations('Panel')\n",
      'src/components/helper.ts': "export const helper = () => useTranslations('Shared')\n",
      'src/emails/render.ts': "export const render = () => createTranslator({ namespace: 'Email' })\n",
      'src/app/page.tsx': "export default async () => getTranslations('Shared')\n",
    })
    const { client, server } = namespaceUsage(root, NAMESPACES)
    expect([...client.keys()].sort()).toEqual(['Panel', 'Shared'])
    expect([...server.keys()].sort()).toEqual(['Email', 'Shared'])
  })

  it('ignores type-only imports', () => {
    const root = project({
      'src/components/panel.tsx': "'use client'\nimport { type Props } from './types'\n",
      'src/components/types.ts': "export interface Props {}\nuseTranslations('Shared')\n",
    })
    expect(namespaceUsage(root, NAMESPACES).client.size).toBe(0)
  })
})

describe('checkNamespaces', () => {
  const root = () =>
    project({
      'src/components/panel.tsx': "'use client'\nuseTranslations('Panel')\nuseTranslations('Shared')\n",
      'src/emails/welcome.ts': "createTranslator({ namespace: 'Email' })\n",
    })

  it('passes when the server list matches usage', () => {
    expect(checkNamespaces(root(), NAMESPACES, ['Email'])).toEqual([])
  })

  it('reports a server namespace used by a client module', () => {
    expect(checkNamespaces(root(), NAMESPACES, ['Email', 'Panel'])).toEqual([
      { file: join('src', 'components', 'panel.tsx'), message: 'Panel: server-only namespace used by a client module' },
    ])
  })

  it('reports a namespace missing from the server list', () => {
    expect(checkNamespaces(root(), NAMESPACES, [])).toEqual([
      { file: 'config/i18n.json', message: 'Email: used only on the server, add it to serverNamespaces' },
    ])
  })

  it('reports an unknown server namespace', () => {
    expect(checkNamespaces(root(), NAMESPACES, ['Email', 'Ghost'])).toEqual([
      { file: 'config/i18n.json', message: 'Ghost: not a namespace of the source catalog' },
    ])
  })
})
