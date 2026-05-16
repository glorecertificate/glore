#!/usr/bin/env node

/**
 * i18n Audit Script
 *
 * Scans the repository for translation key usage and:
 *   1. Collects all keys referenced in source files
 *   2. Removes keys not present in it.json (primary locale)
 *   3. Removes keys from en.json that are missing in it.json
 *   4. Reports unused keys found in both files and removes them
 *   5. Detects malformed ICU/placeholder patterns and reports them
 *   6. Sorts both files by key (recursively, alphabetically)
 *   7. Ensures en.json mirrors the exact key structure of it.json
 *
 * Usage:
 *   node .agents/skills/i18n-audit/scripts/audit.js [--dry-run] [--fix] [--verbose]
 *
 * Flags:
 *   --dry-run        Report issues without writing any files (default: false)
 *   --remove-unused  Also delete keys from it.json that are not found in source scans.
 *                    Omit this flag (default) to only REPORT unused keys — safe for dynamic keys.
 *   --verbose        Log every key checked
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs'
import { extname, join, relative, resolve } from 'path'

// ─── Config ──────────────────────────────────────────────────────────────────

const ROOT = resolve(new URL('.', import.meta.url).pathname, '../../../..')
const MESSAGES_DIR = join(ROOT, 'messages')
const IT_PATH = join(MESSAGES_DIR, 'it.json')
const EN_PATH = join(MESSAGES_DIR, 'en.json')
const SRC_DIR = join(ROOT, 'src')

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const IGNORE_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'build', '.agents', 'public'])

const DRY_RUN = process.argv.includes('--dry-run')
const REMOVE_UNUSED = process.argv.includes('--remove-unused')
const VERBOSE = process.argv.includes('--verbose')

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg) { process.stdout.write(`${msg  }\n`) }
function info(msg) { log(`  ${msg}`) }
function warn(msg) { log(`  ⚠  ${msg}`) }
function ok(msg) { log(`  ✓  ${msg}`) }

/** Recursively collect all source files */
function collectSourceFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (IGNORE_DIRS.has(entry)) continue
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) collectSourceFiles(full, files)
    else if (SOURCE_EXTENSIONS.has(extname(entry))) files.push(full)
  }
  return files
}

/** Flatten a nested JSON object into dot-paths: { 'Ns.key': value } */
function flatten(obj, prefix = '') {
  const result = {}
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(result, flatten(v, path))
    } else {
      result[path] = v
    }
  }
  return result
}

/** Set a nested key in an object using dot-path */
function setDeep(obj, dotPath, value) {
  const parts = dotPath.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in cur)) cur[parts[i]] = {}
    cur = cur[parts[i]]
  }
  cur[parts[parts.length - 1]] = value
}

/** Recursively sort object keys alphabetically */
function sortKeys(obj) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return obj
  const sorted = {}
  for (const key of Object.keys(obj).sort((a, b) => a.localeCompare(b))) {
    sorted[key] = sortKeys(obj[key])
  }
  return sorted
}

/** Build a set of all translation keys referenced in source files.
 *  next-intl usage patterns:
 *    t('key')  t('key', {...})  t.rich('key')  useTranslations('Ns')  getTranslations('Ns')
 *  We extract: full paths like "Ns.key", "Ns.sub.key"
 */
function collectUsedKeys(srcDir) {
  const files = collectSourceFiles(srcDir)
  const usedKeys = new Set()
  const namespaceByFile = new Map()

  // Pattern 1: namespace declaration
  // const t = useTranslations('Ns') | await getTranslations('Ns')
  const nsPattern = /(?:useTranslations|getTranslations)\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g

  // Pattern 2: t('key') calls
  // t('some-key') | t('some-key', {...}) | t.rich('some-key')
  const callPattern = /\bt(?:\.rich|\.markup|\.html)?\s*\(\s*['"`]([^'"`]+)['"`]/g

  // Pattern 3: intlMetadata({ namespace: 'Ns', title: 'meta-title' })
  const intlMetaPattern = /intlMetadata\s*\(\s*\{[^}]*namespace\s*:\s*['"`]([^'"`]+)['"`][^}]*title\s*:\s*['"`]([^'"`]+)['"`]/g
  const intlMetaPattern2 = /intlMetadata\s*\(\s*\{[^}]*title\s*:\s*['"`]([^'"`]+)['"`][^}]*namespace\s*:\s*['"`]([^'"`]+)['"`]/g

  for (const file of files) {
    const src = readFileSync(file, 'utf-8')
    const relFile = relative(ROOT, file)
    const namespaces = []

    // Collect all namespace declarations in file
    let m
    const nsRe = new RegExp(nsPattern.source, 'g')
    while ((m = nsRe.exec(src)) !== null) namespaces.push(m[1])
    namespaceByFile.set(relFile, namespaces)

    // intlMetadata — registers namespace + title key
    const imRe1 = new RegExp(intlMetaPattern.source, 'g')
    while ((m = imRe1.exec(src)) !== null) {
      usedKeys.add(`${m[1]}.${m[2]}`)
      if (VERBOSE) info(`[intlMetadata] ${m[1]}.${m[2]}  (${relFile})`)
    }
    const imRe2 = new RegExp(intlMetaPattern2.source, 'g')
    while ((m = imRe2.exec(src)) !== null) {
      usedKeys.add(`${m[2]}.${m[1]}`)
      if (VERBOSE) info(`[intlMetadata] ${m[2]}.${m[1]}  (${relFile})`)
    }

    // t('key') calls — associate with namespace if we have one
    const callRe = new RegExp(callPattern.source, 'g')
    while ((m = callRe.exec(src)) !== null) {
      const key = m[1]
      for (const ns of namespaces) {
        const full = `${ns}.${key}`
        usedKeys.add(full)
        if (VERBOSE) info(`[t] ${full}  (${relFile})`)
      }
      if (namespaces.length === 0) {
        // bare key — may be nested namespace itself; add as-is for safety
        usedKeys.add(key)
        if (VERBOSE) info(`[t-bare] ${key}  (${relFile})`)
      }
    }
  }

  return usedKeys
}

/** Detect malformed values:
 *  - ICU placeholders in it.json that don't appear in en.json (mismatch)
 *  - Unbalanced { } in placeholder expressions
 *
 *  NOTE: ICU plural/select bodies intentionally differ between languages
 *  (e.g. {count, plural, =1 {# nota} other {# note}} vs {# note}/{# notes}).
 *  We compare only TOP-LEVEL placeholder variable names, not their inner content.
 */
function detectProblems(itFlat, enFlat) {
  const issues = []

  /** Extract top-level placeholder variable names: {varName} or {varName, plural, ...} */
  function topLevelPlaceholders(str) {
    const names = []
    let depth = 0
    let start = -1
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '{') {
        if (depth === 0) start = i + 1
        depth++
      } else if (str[i] === '}') {
        depth--
        if (depth === 0 && start !== -1) {
          const inner = str.slice(start, i)
          const name = inner.split(/[\s,]/)[0].trim()
          if (name) names.push(name)
          start = -1
        }
      }
    }
    return names
  }

  for (const [key, itVal] of Object.entries(itFlat)) {
    if (typeof itVal !== 'string') continue
    const enVal = enFlat[key]

    // Unbalanced braces in IT value
    let depth = 0
    let unbalanced = false
    for (const ch of itVal) {
      if (ch === '{') depth++
      else if (ch === '}') { depth--; if (depth < 0) { unbalanced = true; break } }
    }
    if (depth !== 0 || unbalanced) {
      issues.push({ key, locale: 'it', type: 'unbalanced-braces', value: itVal })
    }

    // Top-level placeholder name mismatch between IT and EN
    if (enVal !== undefined && typeof enVal === 'string') {
      const itNames = topLevelPlaceholders(itVal)
      const enNames = topLevelPlaceholders(enVal)
      const itSet = new Set(itNames)
      const enSet = new Set(enNames)
      const missingInEn = [...itSet].filter(n => !enSet.has(n))
      const extraInEn = [...enSet].filter(n => !itSet.has(n))
      if (missingInEn.length > 0) {
        issues.push({ key, type: 'placeholder-mismatch', detail: `IT has {${missingInEn.join('}, {')}} but EN doesn't` })
      }
      if (extraInEn.length > 0) {
        issues.push({ key, type: 'placeholder-mismatch', detail: `EN has {${extraInEn.join('}, {')}} but IT doesn't` })
      }
    }
  }

  return issues
}

// ─── Main ─────────────────────────────────────────────────────────────────────

log('')
log('i18n Audit')
log('──────────────────────────────────────────────────────')
if (DRY_RUN) log('  Mode: dry-run (no files will be written)')
else if (REMOVE_UNUSED) log('  Mode: fix + remove-unused (unused keys WILL be deleted)')
else log('  Mode: fix (EN-only keys removed, files sorted; unused keys reported only)')
log('')

// Load message files
const itRaw = JSON.parse(readFileSync(IT_PATH, 'utf-8'))
const enRaw = JSON.parse(readFileSync(EN_PATH, 'utf-8'))
const itFlat = flatten(itRaw)
const enFlat = flatten(enRaw)

log(`Loaded it.json: ${Object.keys(itFlat).length} keys`)
log(`Loaded en.json: ${Object.keys(enFlat).length} keys`)

// ─── Step 1: Collect used keys ───────────────────────────────────────────────

log('')
log('Step 1 — Scanning source files for used keys...')
const usedKeys = collectUsedKeys(SRC_DIR)
log(`  Found ${usedKeys.size} unique key references in source`)

// ─── Step 2: Find unused keys in IT (primary) ───────────────────────────────

log('')
log('Step 2 — Checking for unused keys in it.json...')
const unusedInIt = Object.keys(itFlat).filter(k => !usedKeys.has(k))
if (unusedInIt.length === 0) {
  ok('No unused keys found in it.json')
} else {
  const action = REMOVE_UNUSED ? '(will be removed)' : '(pass --remove-unused to delete)'
  warn(`${unusedInIt.length} unused keys found in it.json ${action}:`)
  for (const k of unusedInIt) info(`  - ${k}`)
}

// ─── Step 3: Keys in EN missing from IT → remove from EN ────────────────────

log('')
log('Step 3 — Checking for keys in en.json not present in it.json...')
const enOnlyKeys = Object.keys(enFlat).filter(k => !(k in itFlat))
if (enOnlyKeys.length === 0) {
  ok('en.json has no extra keys beyond it.json')
} else {
  warn(`${enOnlyKeys.length} keys exist in en.json but NOT in it.json (will be removed):`)
  for (const k of enOnlyKeys) info(`  - ${k}`)
}

// ─── Step 4: Keys in IT missing from EN → report ────────────────────────────

log('')
log('Step 4 — Checking for keys in it.json missing from en.json...')
const itMissingInEn = Object.keys(itFlat).filter(k => !(k in enFlat))
if (itMissingInEn.length === 0) {
  ok('en.json covers all keys from it.json')
} else {
  warn(`${itMissingInEn.length} keys in it.json are missing from en.json (manual translation needed):`)
  for (const k of itMissingInEn) info(`  - ${k}  [it: "${itFlat[k]}"]`)
}

// ─── Step 5: Detect format / placeholder problems ───────────────────────────

log('')
log('Step 5 — Detecting malformed or mismatched translations...')
const problems = detectProblems(itFlat, enFlat)
if (problems.length === 0) {
  ok('No format issues found')
} else {
  warn(`${problems.length} issue(s) detected:`)
  for (const p of problems) {
    info(`  [${p.type}] ${p.key}${p.detail ? `: ${  p.detail}` : ''}${p.value ? `  →  "${  p.value  }"` : ''}`)
  }
}

// ─── Step 6: Build cleaned + sorted output ──────────────────────────────────

log('')
log('Step 6 — Building cleaned and sorted output...')

// Only include unused keys in the removal set when explicitly requested
const keysToRemove = new Set([
  ...(REMOVE_UNUSED ? unusedInIt : []),
  ...enOnlyKeys,
])

// Rebuild it.json without unused keys
const itClean = {}
for (const [k, v] of Object.entries(itFlat)) {
  if (!keysToRemove.has(k)) setDeep(itClean, k, v)
}
const itSorted = sortKeys(itClean)

// Rebuild en.json mirroring it.json structure, dropping enOnlyKeys + unusedInIt
const enClean = {}
for (const [k, v] of Object.entries(enFlat)) {
  if (k in itFlat && !keysToRemove.has(k)) setDeep(enClean, k, v)
}
const enSorted = sortKeys(enClean)

const itOut = `${JSON.stringify(itSorted, null, 2)  }\n`
const enOut = `${JSON.stringify(enSorted, null, 2)  }\n`

const itChanged = itOut !== readFileSync(IT_PATH, 'utf-8')
const enChanged = enOut !== readFileSync(EN_PATH, 'utf-8')

if (!itChanged && !enChanged) {
  ok('Both files are already clean and sorted — nothing to write')
} else {
  if (DRY_RUN) {
    if (itChanged) warn('it.json would be modified (dry-run, skipping write)')
    if (enChanged) warn('en.json would be modified (dry-run, skipping write)')
  } else {
    if (itChanged) { writeFileSync(IT_PATH, itOut, 'utf-8'); ok('it.json updated') }
    if (enChanged) { writeFileSync(EN_PATH, enOut, 'utf-8'); ok('en.json updated') }
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

log('')
log('──────────────────────────────────────────────────────')
log('Summary')
log(`  Unused keys (reported):      ${unusedInIt.length}${REMOVE_UNUSED ? ' (removed)' : ' (use --remove-unused to delete)'}`)
log(`  EN-only keys removed:        ${enOnlyKeys.length}`)
log(`  Keys missing in EN (manual): ${itMissingInEn.length}`)
log(`  Format issues:               ${problems.length}`)
log('')

if (problems.length > 0 || itMissingInEn.length > 0) {
  log('Action required: review the items above that need manual attention.')
  process.exit(1)
} else {
  log('All done.')
  process.exit(0)
}
