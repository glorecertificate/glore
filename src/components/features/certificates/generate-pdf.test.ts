import { constants, inflateSync } from 'node:zlib'

import { type ReactNode, isValidElement } from 'react'

import { Text } from '@react-pdf/renderer'
import { describe, expect, it } from 'vitest'

import { CertificateDocument, partnerFontSize } from '@/components/features/certificates/document'
import { certificatePdfLabels, generateCertificatePdf } from '@/components/features/certificates/generate-pdf'

const task = 'Welcomed new volunteers and organized weekly activities for children at the community centre'

const TEMPLATE_BASELINES: Record<number, number[]> = {
  9: [236.5, 252.5, 268.5, 322.8, 450.4, 577.9, 705.5],
  10: [265.3, 333.4, 351.4, 369.4, 395.7, 427.8, 439.9, 520.5, 532.1, 545.1, 561.1, 687.3, 718.9],
  11: [198.6, 211.8, 241.9, 370.8, 498.4, 626],
  13.2286: [310.1, 513],
  36: [175, 211],
}

const textBaselines = (pdf: Buffer) => {
  const runs: { baseline: number; size: number; x: number }[] = []
  for (const [, body] of pdf.toString('latin1').matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/gu)) {
    const content = (() => {
      try {
        return inflateSync(Buffer.from(body ?? '', 'latin1'), { finishFlush: constants.Z_SYNC_FLUSH }).toString(
          'latin1'
        )
      } catch {
        return ''
      }
    })()
    const stack: [number, number][] = []
    let x = 0
    let y = 0
    for (const line of content.split('\n')) {
      if (line === 'q') {
        stack.push([x, y])
        continue
      }
      if (line === 'Q') {
        ;[x, y] = stack.pop() ?? [0, 0]
        continue
      }
      const move = /^1 0 0 1 (\S+) (\S+) cm$/u.exec(line)
      if (move) {
        x += Number(move[1])
        y += Number(move[2])
        continue
      }
      const font = /^\/F\d+ (\S+) Tf$/u.exec(line)
      if (font) runs.push({ baseline: y, size: Number(font[1]), x })
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
  organization: {
    legalRepresentative: 'Maria Rossi',
    logoUrl: `${process.cwd()}/public/certificate/erasmus-plus.png`,
    name: 'Associazione JOINT',
    signatureUrl: null,
  },
  skills: [1, 2, 3, 4].map(number => ({
    description: task,
    icon: 'users',
    level: 2,
    name: `Soft skills ${number}`,
    steps: 3,
  })),
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
    description: 'Listened to the needs of the group and adapted the plan to include everyone.',
    icon,
    level: (index % 3) + 1,
    name: `Skill ${index + 1}`,
    steps: 3,
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
    expect((await certificatePdfLabels('es')).levels).toHaveLength(3)
  })

  it('keeps four long tasks above the representative line', async () => {
    const longTask = `${task}, and kept the shared stock register up to date`.slice(0, 110)
    const tasks = [1, 2, 3, 4].map(number => `${number} ${longTask}`.slice(0, 110))
    const runs = textBaselines(
      await generateCertificatePdf({ ...input(4), activity: { ...input(4).activity, tasks } }, 'en')
    )
    const taskBaselines = runs.filter(run => run.size < 10 && run.x < 220 && run.baseline > 548 && run.baseline < 735)
    expect(taskBaselines.length).toBeGreaterThanOrEqual(8)
    expect(Math.max(...taskBaselines.map(run => run.baseline))).toBeLessThanOrEqual(672)
  })

  it('lands every template text baseline within 1 pt', async () => {
    const runs = textBaselines(await generateCertificatePdf(templateInput, 'en'))
    for (const [size, baselines] of Object.entries(TEMPLATE_BASELINES)) {
      const actual = runs.filter(run => Math.abs(run.size - Number(size)) < 0.05).map(run => run.baseline)
      for (const expected of baselines) {
        const nearest = Math.min(...actual.map(baseline => Math.abs(baseline - expected)))
        expect(nearest, `${size} pt baseline ${expected}`).toBeLessThanOrEqual(1)
      }
    }
  })

  it('puts the organization name on one line without a logo', async () => {
    const organization = { ...templateInput.organization, logoUrl: null }
    const runs = textBaselines(await generateCertificatePdf({ ...templateInput, organization }, 'en'))
    const partner = runs.filter(run => run.x < 220 && run.baseline > 420 && run.baseline < 470)
    expect(partner.map(run => Math.round(run.baseline))).toEqual([428])
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
          skills: [{ description: null, level: 2, name: 'Soft skills', steps: 3 }],
        },
        labels,
      })
    )
    expect(lines).toContain(`${labels.level} ${labels.levels[1]}`)
  })
})

describe('partnerFontSize', () => {
  it('keeps the template size for a short organization name', () => {
    expect(partnerFontSize('Joint')).toBe(10.0464)
  })

  it('shrinks a long name until it stays inside its section bar', () => {
    const name = 'Associazione Culturale Giovanile per la Mobilita Internazionale e il Volontariato Europeo'
    const size = partnerFontSize(name)
    expect(size).toBeLessThan(10.0464)
    expect(size).toBeGreaterThanOrEqual(6.5)
  })
})
