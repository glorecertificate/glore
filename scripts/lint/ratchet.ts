import { posix } from 'node:path'

export interface Diagnostic {
  code: string
  filename: string
  labels: { span: { column: number; line: number } }[]
  message: string
}

export type Counts = Record<string, Record<string, number>>

export interface Change {
  baseline: number
  current: number
  folder: string
  rule: string
}

export const ruleName = (code: string) => code.replace(/^[\w-]+\((.+)\)$/u, '$1')

const sortCounts = (counts: Counts): Counts =>
  Object.fromEntries(
    Object.keys(counts)
      .toSorted()
      .map(folder => [
        folder,
        Object.fromEntries(Object.entries(counts[folder]).toSorted(([a], [b]) => a.localeCompare(b))),
      ])
  )

export const countByFolder = (diagnostics: Diagnostic[]) => {
  const counts: Counts = {}
  for (const diagnostic of diagnostics) {
    const folder = posix.dirname(diagnostic.filename)
    const rule = ruleName(diagnostic.code)
    counts[folder] ??= {}
    counts[folder][rule] = (counts[folder][rule] ?? 0) + 1
  }
  return sortCounts(counts)
}

const entries = (counts: Counts) =>
  Object.entries(counts).flatMap(([folder, rules]) => Object.keys(rules).map(rule => `${folder}\n${rule}`))

export const compareCounts = (baseline: Counts, current: Counts) => {
  const keys = [...new Set([...entries(baseline), ...entries(current)])].toSorted()
  const changes = keys.map(key => {
    const [folder, rule] = key.split('\n')
    return { baseline: baseline[folder]?.[rule] ?? 0, current: current[folder]?.[rule] ?? 0, folder, rule }
  })
  return {
    decreased: changes.filter(change => change.current < change.baseline),
    increased: changes.filter(change => change.current > change.baseline),
  }
}

export const formatCounts = (counts: Counts) => `${JSON.stringify(sortCounts(counts), null, 2)}\n`

export const violationsFor = (diagnostics: Diagnostic[], change: Change, changedFiles = new Set<string>()) => {
  const matching = diagnostics.filter(
    diagnostic => posix.dirname(diagnostic.filename) === change.folder && ruleName(diagnostic.code) === change.rule
  )
  const changed = matching.filter(diagnostic => changedFiles.has(diagnostic.filename))
  return (changed.length > 0 ? changed : matching).map(diagnostic => {
    const span = diagnostic.labels[0]?.span
    return `${diagnostic.filename}:${span?.line ?? 0}:${span?.column ?? 0} ${diagnostic.message}`
  })
}
