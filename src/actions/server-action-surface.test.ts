import { globSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'

import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { parseAst } from 'vitest/node'

const store = vi.hoisted(() => ({ setCookie: vi.fn() }))

vi.mock('@/lib/cookie-store', () => store)

interface Node {
  [key: string]: any
  type: string
}

interface Violation {
  file: string
  name: string
  reason: string
}

const SRC = join(import.meta.dirname, '..')

const GUARDS = new Set<string>([
  'adminAction',
  'authorizeMessage',
  'isAuthRateLimited',
  'readLegalEditor',
  'requireLegalAdmin',
  'requireLegalEditor',
  'authorizeEditor',
  'certificateAction',
  'currentLearner',
  'getAuthUser',
  'getCurrentUser',
  'getOrganizationAccess',
  'getOrganizationContext',
  'getSessionUser',
  'getLearningContext',
  'getSession',
  'guard',
  'requireAdmin',
  'requireAdminWithLimit',
  'requireAssignedTutor',
  'requireCertificateManager',
  'requireEditor',
  'requireManagedCertificate',
  'requireRateLimitedUser',
  'requireTutorRole',
])

const PUBLIC: Record<string, string> = {
  'actions/auth.ts#getAuthUser': 'Reads only the session of the caller.',
  'actions/auth.ts#logout': 'Ends only the session of the caller.',
  'actions/auth.ts#refreshAuthSession': 'Refreshes only the session of the caller.',
  'actions/auth.ts#updatePassword': 'Password reset by a single-use emailed token, before sign-in.',
  'actions/certificates/queries.ts#findPublicCertificate':
    'Public profile lookup: rate limited, and only for users who turned the public profile on.',
  'actions/certificates/queries.ts#getCertificateEligibility':
    'Takes no id: counts the completed courses of the session user.',
  'actions/certificates/queries.ts#lookupLegacyCertificateCode':
    'Public verification by legacy code: rate limited, returns a code and no personal data.',
  'actions/cookies.ts#setLocaleCookie': 'Writes the locale cookie of the caller, validated against LOCALES.',
  'actions/courses/queries.ts#listSkillGroups': 'Public reference data: ids, names, and slugs of skill groups.',
  'actions/i18n.ts#getClientMessages': 'Public message catalog, locale validated against LOCALES.',
  'actions/organizations/invitee.ts#signInToAcceptInvitation':
    'Sign-in before an account session exists: single-use token, rate limited by address and email.',
  'actions/organizations/join-links.ts#requestOrganizationAccess':
    'Public join form: invite link token, rate limited by address, email, and token.',
  'actions/organizations/requests.ts#requestOrganizationRegistration':
    'Public registration form: rate limited by address and email, creates a pending application.',
}

const isNode = (value: unknown): value is Node =>
  typeof value === 'object' && value !== null && typeof (value as Node).type === 'string'

const children = (node: Node) =>
  Object.values(node).flatMap(value => (Array.isArray(value) ? value.filter(isNode) : isNode(value) ? [value] : []))

const identifiers = (node: Node): string[] => [
  ...(node.type === 'Identifier' ? [node.name as string] : []),
  ...children(node).flatMap(identifiers),
]

const isFunctionLike = (node: Node | null | undefined): boolean =>
  !!node &&
  (node.type === 'ArrowFunctionExpression' ||
    node.type === 'FunctionExpression' ||
    node.type === 'FunctionDeclaration' ||
    (node.type === 'CallExpression' && node.arguments.some(isFunctionLike)) ||
    (node.type === 'TSAsExpression' && isFunctionLike(node.expression)) ||
    (node.type === 'TSSatisfiesExpression' && isFunctionLike(node.expression)))

const hasUseServer = (body: Node[]) => {
  for (const statement of body) {
    if (statement.type !== 'ExpressionStatement' || typeof statement.directive !== 'string') return false
    if (statement.directive === 'use server') return true
  }
  return false
}

const analyzeSource = (file: string, source: string): Violation[] => {
  const program = parseAst(source, { lang: file.endsWith('.tsx') ? 'tsx' : 'ts' }) as Node
  if (!hasUseServer(program.body)) return []

  const local = new Map<string, Node>()
  const types = new Set<string>()
  const register = (declaration: Node) => {
    if (declaration.type === 'FunctionDeclaration' && declaration.id) local.set(declaration.id.name, declaration)
    if (declaration.type === 'TSInterfaceDeclaration' || declaration.type === 'TSTypeAliasDeclaration') {
      types.add(declaration.id.name)
    }
    if (declaration.type !== 'VariableDeclaration') return
    for (const declarator of declaration.declarations) {
      if (declarator.id.type === 'Identifier' && isFunctionLike(declarator.init)) {
        local.set(declarator.id.name, declarator.init)
      }
    }
  }
  for (const statement of program.body) {
    register(statement.type.startsWith('Export') && statement.declaration ? statement.declaration : statement)
  }

  const guarded = (name: string, seen = new Set<string>()): boolean => {
    if (seen.has(name)) return false
    seen.add(name)
    const fn = local.get(name)
    if (!fn) return false
    const used = identifiers(fn)
    return used.some(id => GUARDS.has(id)) || used.some(id => local.has(id) && guarded(id, seen))
  }

  const violations: Violation[] = []
  const flag = (name: string, reason: string) => violations.push({ file, name, reason })
  const check = (exported: string, localName: string) => {
    if (!local.has(localName)) return flag(exported, 'not a function declared in this file')
    if (guarded(localName) || PUBLIC[`${file}#${exported}`]) return
    flag(exported, 'calls no guard and is not in the public allowlist')
  }

  for (const statement of program.body) {
    if (statement.type === 'ExportAllDeclaration') {
      if (statement.exportKind !== 'type') flag('*', 'export * re-exports')
      continue
    }
    if (statement.type === 'ExportDefaultDeclaration') {
      const { declaration } = statement
      if (declaration.type === 'FunctionDeclaration' && declaration.id) check('default', declaration.id.name)
      else if (declaration.type === 'Identifier') check('default', declaration.name)
      else flag('default', 'default export of a non-function declaration')
      continue
    }
    if (statement.type !== 'ExportNamedDeclaration' || statement.exportKind === 'type') continue
    if (statement.source) {
      for (const specifier of statement.specifiers) {
        if (specifier.exportKind !== 'type') flag(specifier.exported.name ?? specifier.exported.value, 're-export')
      }
      continue
    }
    for (const specifier of statement.specifiers) {
      if (specifier.exportKind === 'type' || types.has(specifier.local.name)) continue
      check(specifier.exported.name ?? specifier.exported.value, specifier.local.name)
    }
    const { declaration } = statement
    if (!declaration) continue
    if (declaration.type === 'FunctionDeclaration') check(declaration.id.name, declaration.id.name)
    if (declaration.type === 'VariableDeclaration') {
      for (const declarator of declaration.declarations) {
        if (declaration.kind !== 'const' || declarator.id.type !== 'Identifier') {
          flag(declarator.id.name ?? 'pattern', 'not a const function')
          continue
        }
        check(declarator.id.name, declarator.id.name)
      }
    }
    if (declaration.type === 'ClassDeclaration' || declaration.type === 'TSEnumDeclaration') {
      flag(declaration.id.name, 'not a function')
    }
  }
  return violations
}

const analyzeFiles = (root: string, files: string[]) =>
  files.flatMap(file => analyzeSource(relative(root, join(root, file)), readFileSync(join(root, file), 'utf8')))

describe('server action surface', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'surface-'))

  beforeEach(() => {
    store.setCookie.mockReset()
  })

  afterAll(() => {
    rmSync(scratch, { force: true, recursive: true })
  })

  it('keeps every exported server action a guarded function declared in its own file', () => {
    const files = globSync('**/*.{ts,tsx}', { cwd: SRC }).filter(file => !file.endsWith('.test.ts'))
    expect(analyzeFiles(SRC, files)).toEqual([])
  })

  it('rejects aliases, re-exports, and unguarded actions in any directive style', () => {
    const cases: Record<string, string> = {
      'alias.ts': `'use server'\nexport { findUser as getUser } from '@/actions/user-data'`,
      'all.ts': `'use server'\nexport * from '@/actions/user-data'`,
      'default.ts': `'use server'\nexport default async (id: string) => id`,
      'double.ts': `"use server"\nexport const open = async (id: string) => id`,
      'let.ts': `'use server'\nexport let open = async () => 1`,
      'link.ts': `'use server'\nimport { findUser } from '@/actions/user-data'\nexport const readUser = findUser`,
      'local.ts': `'use server'\nconst read = async () => 1\nexport { read as open }`,
    }
    for (const [name, source] of Object.entries(cases)) writeFileSync(join(scratch, name), source)
    for (const name of Object.keys(cases)) expect(analyzeFiles(scratch, [name]), name).not.toEqual([])
  })

  it('accepts a guarded action and ignores modules without the directive', () => {
    mkdirSync(join(scratch, 'ok'))
    writeFileSync(
      join(scratch, 'ok/guarded.ts'),
      `'use server'\nexport interface Out {}\nexport const read = async () => { await getCurrentUser() }`
    )
    writeFileSync(join(scratch, 'ok/plain.ts'), `export const read = async () => 1\nexport * from './x'`)
    expect(analyzeFiles(scratch, ['ok/guarded.ts', 'ok/plain.ts'])).toEqual([])
  })

  it('keeps the locale cookie action to supported locales', async () => {
    const { setLocaleCookie } = await import('@/actions/cookies')
    await setLocaleCookie('evil')
    await setLocaleCookie('')
    expect(store.setCookie).not.toHaveBeenCalled()
    await setLocaleCookie('it')
    expect(store.setCookie).toHaveBeenCalledWith('NEXT_LOCALE', 'it', { prefix: false })
  })
})
