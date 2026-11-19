const FORMULA_START = /^[=+\-@\t\r]/u

const escapeCell = (value: string) => {
  const safe = FORMULA_START.test(value) ? `'${value}` : value
  return /[",\n\r]/u.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe
}

export const toCsv = (rows: string[][]) => rows.map(row => row.map(escapeCell).join(',')).join('\r\n')

export const parseCsv = (text: string) => {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  const source = text.replace(/^﻿/u, '')

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        cell += '"'
        index += 1
        continue
      }
      if (char === '"') {
        quoted = false
        continue
      }
      cell += char
      continue
    }
    if (char === '"') {
      quoted = true
      continue
    }
    if (char === ',' || char === ';') {
      row.push(cell)
      cell = ''
      continue
    }
    if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index += 1
      row.push(cell)
      cell = ''
      if (row.some(value => value.trim() !== '')) rows.push(row)
      row = []
      continue
    }
    cell += char
  }

  row.push(cell)
  if (row.some(value => value.trim() !== '')) rows.push(row)
  return rows
}

const EMAIL_CELL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u

export const extractCsvEmails = (text: string) => [
  ...new Set(
    parseCsv(text).flatMap(row =>
      row.flatMap(cell => {
        const email = cell.trim().toLowerCase()
        return EMAIL_CELL.test(email) ? [email] : []
      })
    )
  ),
]
