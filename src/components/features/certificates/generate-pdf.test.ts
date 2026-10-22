import { inflateSync } from 'node:zlib'

import { type ReactNode, isValidElement } from 'react'

import { Text } from '@react-pdf/renderer'
import { describe, expect, it } from 'vitest'

import { CertificateDocument } from '@/components/features/certificates/document'
import { certificatePdfLabels, generateCertificatePdf } from '@/components/features/certificates/generate-pdf'

const task = 'Welcomed new volunteers and organized weekly activities for children at the community centre'

const TEMPLATE_BASELINES: Record<number, number[]> = {
  9: [236.5, 252.5, 268.5, 322.8, 450.4, 577.9, 705.5],
  10: [265.3, 333.4, 351.4, 369.4, 395.7, 427.8, 439.9, 520.5, 532.1, 545.1, 561.1, 687.3, 718.9],
  11: [198.6, 211.8, 241.9, 370.8, 498.4, 626],
  13.2: [310.1, 513],
  36: [175, 211],
}

const textBaselines = (pdf: Buffer) => {
  const runs: { baseline: number; size: number }[] = []
  for (const [, body] of pdf.toString('latin1').matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/gu)) {
    const content = (() => {
      try {
        return inflateSync(Buffer.from(body ?? '', 'latin1')).toString('latin1')
      } catch {
        return ''
      }
    })()
    const stack: number[] = []
    let y = 0
    for (const line of content.split('\n')) {
      if (line === 'q') {
        stack.push(y)
        continue
      }
      if (line === 'Q') {
        y = stack.pop() ?? 0
        continue
      }
      const move = /^1 0 0 1 \S+ (\S+) cm$/u.exec(line)
      if (move) {
        y += Number(move[1])
        continue
      }
      const font = /^\/F\d+ (\S+) Tf$/u.exec(line)
      if (font) runs.push({ baseline: y, size: Number(font[1]) })
    }
  }
  return runs
}

const joined = (node: ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(joined).join('')
  return isValidElement<{ children?: ReactNode }>(node) ? joined(node.props.children) : ''
}

const textLines = (node: ReactNode): string[] => {
  if (Array.isArray(node)) return node.flatMap(textLines)
  if (!isValidElement<{ children?: ReactNode }>(node)) return []
  const nested = textLines(node.props.children)
  return node.type === Text ? [joined(node), ...nested] : nested
}

const templateInput = {
  activity: {
    duration: null,
    endDate: null,
    location: null,
    startDate: null,
    tasks: [1, 2, 3].map(number => `${task} ${number}`),
  },
  code: null,
  holder: {
    birthPlace: 'Manchester',
    birthday: '2022-01-01',
    firstName: 'Oliver',
    lastName: 'Matthews',
    nationality: 'BRITISH',
  },
  issuedAt: '2022-01-01',
  organization: { legalRepresentative: 'Maria Rossi', logoUrl: null, name: 'Associazione JOINT', signatureUrl: null },
  skills: [1, 2, 3, 4].map(number => ({ icon: 'users', level: 4, name: `Soft skills ${number}`, statement: task })),
}

const input = (skillCount: number) => ({
  activity: {
    duration: 120,
    endDate: '2026-06-30',
    location: 'Milan',
    startDate: '2026-01-10',
    tasks: [task, task, task],
  },
  code: 'ABCD-EFGH-JKMN',
  holder: {
    birthPlace: 'Manchester',
    birthday: '2000-01-01',
    firstName: 'Oliver',
    lastName: 'Matthews',
    nationality: 'GB',
  },
  issuedAt: '2026-07-01T10:00:00Z',
  organization: { legalRepresentative: 'Maria Rossi', logoUrl: null, name: 'Associazione Joint', signatureUrl: null },
  skills: ['messages-square', 'users', 'heart-handshake', 'flag'].slice(0, skillCount).map((icon, index) => ({
    icon,
    level: index + 2,
    name: `Skill ${index + 1}`,
    statement: 'Listened to the needs of the group and adapted the plan to include everyone.',
  })),
})

describe('generateCertificatePdf', () => {
  it.each([
    ['en', 4],
    ['es', 4],
    ['it', 3],
  ])('renders a %s certificate with %i skills', async (language, skillCount) => {
    const buffer = await generateCertificatePdf(input(skillCount), language)
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-')
    expect(buffer.length).toBeGreaterThan(10_000)
  })

  it('localizes labels and falls back to English', async () => {
    expect((await certificatePdfLabels('it')).title).toBe('Certificato di soft skill')
    expect((await certificatePdfLabels('fr')).title).toBe('Soft skills certificate')
    expect((await certificatePdfLabels('es')).levels).toHaveLength(5)
  })

  it('lands every template text baseline within 1 pt', async () => {
    const runs = textBaselines(await generateCertificatePdf(templateInput, 'en'))
    for (const [size, baselines] of Object.entries(TEMPLATE_BASELINES)) {
      const actual = runs.filter(run => run.size === Number(size)).map(run => run.baseline)
      for (const expected of baselines) {
        const nearest = Math.min(...actual.map(baseline => Math.abs(baseline - expected)))
        expect(nearest, `${size} pt baseline ${expected}`).toBeLessThanOrEqual(1)
      }
    }
  })

  it.each(['en', 'es', 'it'])('separates the level label from the level word in %s', async language => {
    const labels = await certificatePdfLabels(language)
    const lines = textLines(
      CertificateDocument({
        data: {
          ...templateInput,
          qrPath: null,
          qrSize: 0,
          verifyUrl: null,
          skills: [{ level: 4, name: 'Soft skills', statement: null }],
        },
        labels,
      })
    )
    expect(lines).toContain(`${labels.level} ${labels.levels[3]}`)
  })
})
