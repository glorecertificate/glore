// eslint-disable-next-line react-doctor/prefer-dynamic-import
import {
  Circle,
  Document,
  Font,
  Image,
  Line,
  Page,
  Path,
  Polygon,
  Polyline,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer'

import { ARROW_PATHS, LOGO_PATHS } from '@/components/features/certificates/pdf-assets'

type IconNode = [string, Record<string, string>][]

export interface CertificatePdfSkill {
  iconNode?: IconNode | null
  level: number
  name: string
  statement: string | null
}

export interface CertificatePdfData {
  activity: {
    duration: number | null
    endDate: string | null
    location: string | null
    startDate: string | null
    tasks: string[]
  }
  code: string | null
  holder: {
    birthPlace: string | null
    birthday: string | null
    firstName: string
    lastName: string | null
    nationality: string | null
  }
  issuedAt: string | null
  organization: {
    legalRepresentative: string | null
    logoUrl: string | null
    name: string
    signatureUrl: string | null
  }
  qrPath: string | null
  qrSize: number
  skills: CertificatePdfSkill[]
  verifyUrl: string | null
}

export interface CertificatePdfLabels {
  at: string
  date: string
  dateOfBirth: string
  from: string
  headingAfter: string
  headingBefore: string
  headingHighlight: string
  hours: string
  level: string
  levels: string[]
  mainTasks: string
  nationality: string
  partnership: string
  placeOfBirth: string
  representedBy: string
  tasksIntro: string
  title: string
  to: string
  verify: string
  volunteering: string
}

export interface CertificateDocumentProps {
  data: CertificatePdfData
  labels: CertificatePdfLabels
}

const NAVY = '#315070'
const GREEN = '#7fbf73'
const GRAY = '#f0f0f0'
const LEVEL_GRAY = '#3c4045'
const BANNER = '#345372'
const ARROW_OPACITY = 0.12

const assetSource = (file: string) => (typeof window === 'undefined' ? `${process.cwd()}/public${file}` : file)

Font.register({
  family: 'Roboto',
  fonts: [
    { src: assetSource('/fonts/roboto/Roboto-Regular.ttf'), fontWeight: 400 },
    { src: assetSource('/fonts/roboto/Roboto-Bold.ttf'), fontWeight: 700 },
    { src: assetSource('/fonts/roboto/Roboto-Black.ttf'), fontWeight: 900 },
  ],
})
Font.registerHyphenationCallback(word => [word])

const fade = (hex: string) => {
  const channel = (index: number) => {
    const value = Number.parseInt(hex.slice(index, index + 2), 16)
    return Math.round(255 - ARROW_OPACITY * (255 - value))
      .toString(16)
      .padStart(2, '0')
  }
  return `#${channel(1)}${channel(3)}${channel(5)}`
}

const FADED_ARROWS = ARROW_PATHS.map(path => ({ ...path, fill: fade(path.fill) }))

const TEMPLATE_FONT_ASCENT = 1.056
const ROBOTO_FONT_ASCENT = 1900 / 2048
const BANNER_TRACKING = -0.0123
const HEADING_TRACKING = 0.73

const textShift = (fontSize: number) => (TEMPLATE_FONT_ASCENT - ROBOTO_FONT_ASCENT) * fontSize

const placed = (top: number, fontSize: number) => ({ fontSize, top: top + textShift(fontSize) })

const SKILL_TOPS = [226.5, 355.1, 482.7, 610.3]
const DOT_LEFTS = [269.3, 304.8, 340.4, 375.9, 411.5]
const STATEMENT_OFFSET = 27.8
const LEVEL_OFFSET = 86.25
const LEVEL_RIGHT = 595.28 - 544.4
const TASK_TOP = 550.6
const TASK_PITCH = 40
const TASK_BOTTOM = 672
const TASK_SIGNED_BOTTOM = 643
const TASK_GAP = 3
const TASK_WIDTH = 158.7
const TASK_LINE_HEIGHT = 1.2
const TASK_CHAR_WIDTH = 0.45
const TASK_FONT_SIZES = [10, 9.5, 9, 8.5, 8, 7.5, 7]

const taskLines = (task: string, fontSize: number) => {
  const limit = Math.max(1, Math.floor(TASK_WIDTH / (fontSize * TASK_CHAR_WIDTH)))
  return `\u2022 ${task}`
    .split(/\s+/u)
    .reduce(
      ({ length, lines }, word) =>
        length === 0 || length + 1 + word.length > limit
          ? { length: word.length, lines: lines + 1 }
          : { length: length + 1 + word.length, lines },
      { length: 0, lines: 0 }
    ).lines
}

const taskHeight = (task: string, fontSize: number) => taskLines(task, fontSize) * fontSize * TASK_LINE_HEIGHT

const flowHeight = (tasks: string[], fontSize: number) =>
  tasks.reduce((height, task) => height + taskHeight(task, fontSize), TASK_GAP * Math.max(0, tasks.length - 1))

const fitsPitch = (tasks: string[], bottom: number) =>
  tasks.every(
    (task, index) =>
      taskHeight(task, 10) <= TASK_PITCH - TASK_GAP && TASK_TOP + index * TASK_PITCH + taskHeight(task, 10) <= bottom
  )

const flowFontSize = (tasks: string[], bottom: number) =>
  TASK_FONT_SIZES.find(size => flowHeight(tasks, size) <= bottom - TASK_TOP) ?? 7

const styles = StyleSheet.create({
  page: { backgroundColor: '#ffffff', color: NAVY, fontFamily: 'Roboto', fontSize: 10, fontWeight: 400 },
  absolute: { position: 'absolute' },
  banner: {
    backgroundColor: BANNER,
    height: 22.7,
    justifyContent: 'center',
    left: 24.7,
    minWidth: 194.3,
    paddingHorizontal: 4,
    position: 'absolute',
    top: 105.3,
  },
  bannerText: { color: '#ffffff', textTransform: 'uppercase' },
  name: { color: '#305071', left: 23.6, position: 'absolute', width: 230 },
  bar: { backgroundColor: NAVY, left: 26.9, position: 'absolute', width: 2.8 },
  personalLine: { left: 45.3, position: 'absolute' },
  strong: { fontWeight: 900, textTransform: 'uppercase' },
  heading: {
    fontWeight: 900,
    left: 46.1,
    letterSpacing: HEADING_TRACKING,
    position: 'absolute',
    textTransform: 'uppercase',
  },
  row: { alignItems: 'flex-start', flexDirection: 'row', left: 46.1, position: 'absolute', width: 176.3 },
  rowLabel: { marginTop: textShift(10) },
  rowLine: {
    borderBottomColor: NAVY,
    borderBottomWidth: 0.75,
    marginHorizontal: 1.5,
    minHeight: 10,
    paddingLeft: 3,
  },
  rowValue: { fontSize: 10, fontWeight: 700, lineHeight: 1, maxLines: 1, textOverflow: 'ellipsis' },
  partnerName: { fontWeight: 900, lineHeight: 1.21, left: 46.1, position: 'absolute', width: 68 },
  partnerLogo: { height: 54.6, left: 119.2, objectFit: 'contain', position: 'absolute', top: 418, width: 90.7 },
  partnerPlaceholder: { backgroundColor: GRAY, height: 54.6, left: 119.2, position: 'absolute', top: 418, width: 90.7 },
  tasksIntro: { left: 46.3, lineHeight: 1.3, position: 'absolute', width: 172 },
  task: { left: 46.3, lineHeight: 1.2, position: 'absolute', width: 158.7 },
  taskFlow: { left: 46.3, position: 'absolute', rowGap: 3, width: 158.7 },
  taskFlowItem: { lineHeight: 1.2 },
  bullet: { color: GREEN, fontWeight: 900 },
  signatureImage: { height: 28, left: 112, objectFit: 'contain', position: 'absolute', top: 646, width: 100 },
  date: { fontWeight: 900, left: 46.1, position: 'absolute', textTransform: 'uppercase' },
  qr: { left: 46.1, position: 'absolute', top: 735 },
  verify: { fontSize: 7.5, left: 106, position: 'absolute', top: 742, width: 130 },
  verifyCode: { fontSize: 8, fontWeight: 900, marginTop: 2 },
  headingRight: { fontWeight: 700, left: 264.8, lineHeight: 1.2, position: 'absolute', width: 290 },
  highlight: { color: GREEN, textTransform: 'uppercase' },
  skillLabel: {
    alignItems: 'center',
    backgroundColor: GREEN,
    flexDirection: 'row',
    height: 22.9,
    left: 269.3,
    paddingLeft: 7,
    paddingRight: 14.8,
    paddingTop: 1,
    position: 'absolute',
  },
  skillName: { color: '#ffffff', fontSize: 11, fontWeight: 900, marginLeft: 6.7, textTransform: 'uppercase' },
  statement: {
    left: 269.1,
    lineHeight: 1.4,
    maxLines: 3,
    position: 'absolute',
    textOverflow: 'ellipsis',
    width: 280.4,
  },
  levelText: { color: LEVEL_GRAY, position: 'absolute', right: LEVEL_RIGHT, textAlign: 'right' },
  levelWord: { color: GREEN, fontWeight: 900, textTransform: 'lowercase' },
  emblem: { height: 34.1, left: 397.5, position: 'absolute', top: 767.9, width: 150.1 },
})

const formatDate = (value: string | null) => {
  if (!value) return ''
  const [year, month, day] = value.slice(0, 10).split('-')
  if (!(year && month && day)) return ''
  return `${day}.${month}.${year}`
}

const nameSize = (value: string) => Math.min(36, Math.floor(400 / Math.max(value.length, 1)))

const skillNameSize = (value: string) => Math.min(11, Math.floor(3300 / Math.max(value.length, 1)) / 10)

const ICON_STROKE = {
  fill: 'none',
  stroke: '#ffffff',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: 2,
} as const

const IconShape = ({ attrs, tag }: { attrs: Record<string, string>; tag: string }) => {
  const number = (key: string) => Number(attrs[key] ?? 0)
  if (tag === 'path') return <Path d={attrs.d ?? ''} {...ICON_STROKE} />
  if (tag === 'circle') return <Circle cx={number('cx')} cy={number('cy')} r={number('r')} {...ICON_STROKE} />
  if (tag === 'rect') {
    return (
      <Rect
        height={number('height')}
        rx={number('rx')}
        width={number('width')}
        x={number('x')}
        y={number('y')}
        {...ICON_STROKE}
      />
    )
  }
  if (tag === 'line') {
    return <Line x1={number('x1')} x2={number('x2')} y1={number('y1')} y2={number('y2')} {...ICON_STROKE} />
  }
  if (tag === 'polyline') return <Polyline points={attrs.points ?? ''} {...ICON_STROKE} />
  if (tag === 'polygon') return <Polygon points={attrs.points ?? ''} {...ICON_STROKE} />
  return null
}

const SkillIcon = ({ iconNode }: { iconNode?: IconNode | null }) => {
  if (!iconNode) return <View style={{ height: 14.3, width: 14.6 }} />
  return (
    <Svg height={14.3} viewBox="0 0 24 24" width={14.6}>
      {iconNode.map(([tag, attrs]) => (
        <IconShape
          attrs={attrs}
          key={attrs.key ?? `${tag}-${attrs.d ?? attrs.points ?? attrs.cx ?? attrs.x ?? ''}`}
          tag={tag}
        />
      ))}
    </Svg>
  )
}

const RowLine = ({ flex, inset = 1.5, value }: { flex: number; inset?: number; value: string }) => (
  <View style={[styles.rowLine, { flexBasis: 0, flexGrow: flex, marginLeft: inset }]}>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
)

export const CertificateDocument = ({ data, labels }: CertificateDocumentProps) => {
  const { activity, holder, organization } = data
  const lastName = holder.lastName ?? ''
  const tasks = activity.tasks.filter(Boolean).slice(0, 4)
  const tasksBottom = organization.signatureUrl ? TASK_SIGNED_BOTTOM : TASK_BOTTOM
  const flowSize = flowFontSize(tasks, tasksBottom)
  const skills = data.skills.slice(0, 4)
  const titleSize = Math.min(15.9, (15.9 * 23) / Math.max(labels.title.length, 1))

  return (
    <Document author="GloRe" title={`${labels.title}: ${holder.firstName} ${lastName}`.trim()}>
      <Page size="A4" style={styles.page}>
        <Svg height={306.5} style={[styles.absolute, { left: 256, top: 19.5 }]} viewBox="0 0 319.5 306.5" width={319.5}>
          {FADED_ARROWS.map(path => (
            <Path d={path.d} fill={path.fill} key={path.d.slice(0, 24)} />
          ))}
        </Svg>

        {/* Header */}
        <Svg height={86} style={[styles.absolute, { left: 20, top: 18 }]} viewBox="0 0 218 86" width={218}>
          {LOGO_PATHS.map(path => (
            <Path d={path.d} fill={path.fill} key={path.d.slice(0, 24)} />
          ))}
        </Svg>
        <View style={styles.banner}>
          <Text style={[styles.bannerText, { fontSize: titleSize, letterSpacing: BANNER_TRACKING * titleSize }]}>
            {labels.title}
          </Text>
        </View>
        <Text style={[styles.name, placed(137, nameSize(holder.firstName))]}>{holder.firstName}</Text>
        <Text style={[styles.name, { fontWeight: 700 }, placed(173, nameSize(lastName))]}>{lastName}</Text>

        {/* Personal */}
        <View style={[styles.bar, { backgroundColor: GREEN, height: 38.7, top: 230.3 }]} />
        <Text style={[styles.personalLine, placed(227, 9)]}>
          {`${labels.nationality} `}
          <Text style={styles.strong}>{holder.nationality ?? ''}</Text>
        </Text>
        <Text style={[styles.personalLine, placed(243, 9)]}>
          {`${labels.dateOfBirth} `}
          <Text style={styles.strong}>{formatDate(holder.birthday)}</Text>
        </Text>
        <Text style={[styles.personalLine, placed(259, 9)]}>
          {`${labels.placeOfBirth} `}
          <Text style={styles.strong}>{holder.birthPlace ?? ''}</Text>
        </Text>

        {/* Volunteering */}
        <View style={[styles.bar, { height: 173.9, top: 299 }]} />
        <Text style={[styles.heading, placed(296.1, 13.2)]}>{labels.volunteering}</Text>
        <View style={[styles.row, { top: 322.8 }]}>
          <Text style={styles.rowLabel}>{labels.from}</Text>
          <RowLine flex={53.9} value={formatDate(activity.startDate)} />
          <Text style={styles.rowLabel}>{labels.to}</Text>
          <RowLine flex={82.1} value={formatDate(activity.endDate)} />
        </View>
        <View style={[styles.row, { top: 340.8, width: 79.5 }]}>
          <Text style={styles.rowLabel}>{labels.hours}</Text>
          <RowLine flex={1} value={activity.duration ? String(activity.duration) : ''} />
        </View>
        <View style={[styles.row, { top: 358.8 }]}>
          <Text style={styles.rowLabel}>{labels.at}</Text>
          <RowLine flex={1} value={activity.location ?? ''} />
        </View>
        <Text style={[styles.absolute, { left: 46.1 }, placed(385.1, 10)]}>{labels.partnership}</Text>
        <Text style={[styles.partnerName, placed(417.2, 10)]}>{organization.name}</Text>
        {organization.logoUrl ? (
          <Image src={organization.logoUrl} style={styles.partnerLogo} />
        ) : (
          <View style={styles.partnerPlaceholder} />
        )}

        {/* Main tasks */}
        <View style={[styles.bar, { height: 184.4, top: 503.3 }]} />
        <Text style={[styles.heading, placed(499, 13.2)]}>{labels.mainTasks}</Text>
        <Text style={[styles.tasksIntro, placed(521.6, 10)]}>{labels.tasksIntro}</Text>
        {fitsPitch(tasks, tasksBottom) ? (
          tasks.map((task, index) => (
            <Text key={task} style={[styles.task, placed(TASK_TOP + index * TASK_PITCH, 10)]}>
              <Text style={styles.bullet}>{'• '}</Text>
              {task}
            </Text>
          ))
        ) : (
          <View style={[styles.taskFlow, { top: placed(TASK_TOP, flowSize).top }]}>
            {tasks.map(task => (
              <Text key={task} style={[styles.taskFlowItem, { fontSize: flowSize }]}>
                <Text style={styles.bullet}>{'• '}</Text>
                {task}
              </Text>
            ))}
          </View>
        )}
        {organization.signatureUrl ? <Image src={organization.signatureUrl} style={styles.signatureImage} /> : null}
        <View style={[styles.row, { top: 676.8, width: 172.8 }]}>
          <Text style={styles.rowLabel}>{labels.representedBy}</Text>
          <RowLine flex={1} inset={5.7} value={organization.legalRepresentative ?? ''} />
        </View>
        <Text style={[styles.date, placed(708.3, 10)]}>{`${labels.date} ${formatDate(data.issuedAt)}`}</Text>

        {/* Verification */}
        {data.qrPath ? (
          <Svg height={52} style={styles.qr} viewBox={`0 0 ${data.qrSize} ${data.qrSize}`} width={52}>
            <Path d={data.qrPath} fill={NAVY} />
          </Svg>
        ) : null}
        {data.verifyUrl ? (
          <View style={styles.verify}>
            <Text>{labels.verify}</Text>
            <Text style={styles.verifyCode}>{data.verifyUrl}</Text>
          </View>
        ) : null}

        {/* Skills */}
        <Text style={[styles.headingRight, placed(187, 11)]}>
          {labels.headingBefore}
          <Text style={styles.highlight}>{labels.headingHighlight}</Text>
          {labels.headingAfter}
        </Text>
        {skills.map((skill, index) => {
          const top = SKILL_TOPS[index] ?? 0
          const level = Math.max(0, Math.min(5, skill.level))
          return (
            <View key={skill.name}>
              <View style={[styles.skillLabel, { top }]}>
                <SkillIcon iconNode={skill.iconNode} />
                <Text style={[styles.skillName, { fontSize: skillNameSize(skill.name) }]}>{skill.name}</Text>
              </View>
              {skill.statement ? (
                <Text style={[styles.statement, placed(top + STATEMENT_OFFSET, 10)]}>{skill.statement}</Text>
              ) : null}
              <Svg height={11.2} style={[styles.absolute, { left: DOT_LEFTS[0], top: top + 85.1 }]} width={153.4}>
                {DOT_LEFTS.map((left, dot) => (
                  <Circle cx={left - 269.3 + 5.6} cy={5.6} fill={dot < level ? GREEN : GRAY} key={left} r={5.6} />
                ))}
              </Svg>
              {level > 0 ? (
                <Text style={[styles.levelText, placed(top + LEVEL_OFFSET, 9)]}>
                  {`${labels.level} `}
                  <Text style={styles.levelWord}>{labels.levels[level - 1] ?? ''}</Text>
                </Text>
              ) : null}
            </View>
          )
        })}

        {/* Footer */}
        <Image src={assetSource('/certificate/erasmus-plus.png')} style={styles.emblem} />
      </Page>
    </Document>
  )
}
