import { describe, expect, it } from 'vitest'

import { extractCsvEmails, parseCsv, toCsv } from './csv'

describe('csv', () => {
  it('quotes cells with commas, quotes and line breaks', () => {
    expect(toCsv([['a,b', 'say "hi"', 'one\ntwo']])).toBe('"a,b","say ""hi""","one\ntwo"')
  })

  it('neutralizes formula cells', () => {
    expect(toCsv([['=SUM(A1)', '+1', '-1', '@x', 'ok']])).toBe("'=SUM(A1),'+1,'-1,'@x,ok")
  })

  it('round-trips quoted values', () => {
    const rows = [
      ['email', 'note'],
      ['a@x.org', 'hello, "world"'],
    ]
    expect(parseCsv(toCsv(rows))).toEqual(rows)
  })

  it('reads semicolons, CRLF and a byte order mark, and skips blank lines', () => {
    expect(parseCsv('﻿a@x.org;learner\r\n\r\nb@x.org;tutor\r\n')).toEqual([
      ['a@x.org', 'learner'],
      ['b@x.org', 'tutor'],
    ])
  })

  it('extracts unique lowercase addresses from any column and skips headers and bad cells', () => {
    const text = 'Email,Name\nAna@X.org,Ana\nbad-address,Bo\nana@x.org,Dup\n"Cy <c@x.org>",Cy\nd@x.org;Dee\n'
    expect(extractCsvEmails(text)).toEqual(['ana@x.org', 'd@x.org'])
  })
})
