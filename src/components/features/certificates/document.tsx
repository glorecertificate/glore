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

import {
  ARROWS_BOX,
  BANNER,
  BANNER_BOX,
  BANNER_TRACKING,
  type CertificatePdfData,
  type CertificatePdfLabels,
  DATE_SIZE,
  DATE_TOP,
  DOT_LEFTS,
  DOT_SIZE,
  EMBLEM_BOX,
  EMBLEM_SRC,
  FADED_ARROWS,
  GRAY,
  GREEN,
  HEADING_LEFT,
  HEADING_RIGHT,
  HEADING_SIZE,
  HEADING_TRACKING,
  HOURS_ROW,
  type IconNode,
  LEVEL_GRAY,
  LEVEL_RIGHT,
  LEVEL_SIZE,
  LEVEL_SPACE_TRACKING,
  LOCATION_ROW,
  LOGO_BOX,
  NAME_BOX,
  NAME_COLOR,
  NAVY,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  PARTNERSHIP_TOP,
  PARTNER_LEFT,
  PARTNER_LINE_HEIGHT,
  PARTNER_LOGO,
  PARTNER_TOP,
  PERIOD_FROM,
  PERIOD_ROW,
  PERIOD_TO,
  PERSONAL,
  QR_BOX,
  REPRESENTED_ROW,
  ROW_LEFT,
  ROW_LINE_PADDING,
  ROW_LINE_WIDTH,
  ROW_VALUE_TOP,
  SECTION_BAR,
  SIGNATURE_BOX,
  SKILL_DESCRIPTION,
  SKILL_DESCRIPTION_OFFSETS,
  SKILL_DOT_OFFSETS,
  SKILL_ICON,
  SKILL_LABEL,
  SKILL_LABEL_RAISE,
  SKILL_LABEL_TOPS,
  SKILL_LEVEL_OFFSETS,
  SKILL_NAME,
  TASKS_INTRO_LINE_HEIGHT,
  TASKS_INTRO_WIDTH,
  TASKS_SECTION,
  TASK_GAP,
  TASK_LEFT,
  TASK_LINE_HEIGHT,
  TASK_PITCH,
  TASK_TOP,
  TASK_WIDTH,
  VERIFY_BOX,
  VOLUNTEERING,
  VOLUNTEERING_LEFT,
  WHITE,
  formatDate,
  hyphenate,
  nameSize,
  partnerFontSize,
  partnerWidth,
  placed,
  skillDots,
  skillNameSize,
  taskPlan,
  textShift,
  titleSize,
  verifySize,
} from '@/components/features/certificates/certificate-layout'
import { LOGO_PATHS } from '@/components/features/certificates/pdf-assets'

export type { CertificatePdfLabels }
export { partnerFontSize }

export interface CertificateDocumentProps {
  data: CertificatePdfData
  labels: CertificatePdfLabels
}

const assetSource = (file: string) => (typeof window === 'undefined' ? `${process.cwd()}/public${file}` : file)

Font.register({
  family: 'Roboto',
  fonts: [
    { src: assetSource('/fonts/roboto/Roboto-Regular.ttf'), fontWeight: 400 },
    { src: assetSource('/fonts/roboto/Roboto-Bold.ttf'), fontWeight: 700 },
    { src: assetSource('/fonts/roboto/Roboto-Black.ttf'), fontWeight: 900 },
  ],
})
Font.registerHyphenationCallback(hyphenate)

const styles = StyleSheet.create({
  page: { backgroundColor: WHITE, color: NAVY, fontFamily: 'Roboto', fontSize: 10, fontWeight: 400 },
  absolute: { position: 'absolute' },
  banner: {
    backgroundColor: BANNER,
    height: BANNER_BOX.height,
    justifyContent: 'center',
    left: BANNER_BOX.left,
    minWidth: BANNER_BOX.minWidth,
    paddingHorizontal: BANNER_BOX.paddingHorizontal,
    paddingTop: BANNER_BOX.paddingTop,
    position: 'absolute',
    top: BANNER_BOX.top,
  },
  bannerText: { color: WHITE, textTransform: 'uppercase' },
  name: { color: NAME_COLOR, left: NAME_BOX.left, position: 'absolute', width: NAME_BOX.width },
  bar: { backgroundColor: NAVY, left: SECTION_BAR.left, position: 'absolute', width: SECTION_BAR.width },
  personalLine: { left: PERSONAL.left, position: 'absolute' },
  strong: { fontWeight: 900, textTransform: 'uppercase' },
  heading: {
    fontWeight: 900,
    left: HEADING_LEFT,
    letterSpacing: HEADING_TRACKING,
    position: 'absolute',
    textTransform: 'uppercase',
  },
  row: { alignItems: 'flex-start', flexDirection: 'row', left: ROW_LEFT, position: 'absolute' },
  rowLabel: { marginTop: textShift(10) },
  rowLine: {
    borderBottomColor: NAVY,
    borderBottomWidth: ROW_LINE_WIDTH,
    paddingLeft: ROW_LINE_PADDING,
  },
  rowValue: {
    fontSize: 10,
    fontWeight: 700,
    lineHeight: 1,
    maxLines: 1,
    position: 'relative',
    textOverflow: 'ellipsis',
    top: ROW_VALUE_TOP,
  },
  partnerName: {
    fontWeight: 900,
    left: PARTNER_LEFT,
    lineHeight: PARTNER_LINE_HEIGHT,
    position: 'absolute',
  },
  partnerLogo: { ...PARTNER_LOGO, objectFit: 'contain', position: 'absolute' },
  tasksIntro: {
    left: TASK_LEFT,
    lineHeight: TASKS_INTRO_LINE_HEIGHT,
    position: 'absolute',
    width: TASKS_INTRO_WIDTH,
  },
  task: { left: TASK_LEFT, lineHeight: TASK_LINE_HEIGHT, position: 'absolute', width: TASK_WIDTH },
  taskFlow: { left: TASK_LEFT, position: 'absolute', rowGap: TASK_GAP, width: TASK_WIDTH },
  taskFlowItem: { lineHeight: TASK_LINE_HEIGHT },
  bullet: { color: GREEN, fontWeight: 900 },
  signatureImage: { ...SIGNATURE_BOX, objectFit: 'contain', position: 'absolute' },
  date: { fontWeight: 900, left: HEADING_LEFT, position: 'absolute', textTransform: 'uppercase' },
  qr: { left: QR_BOX.left, position: 'absolute', top: QR_BOX.top },
  verify: { fontSize: 7.5, ...VERIFY_BOX, position: 'absolute' },
  verifyCode: { fontWeight: 900, marginTop: 2 },
  headingRight: {
    fontWeight: 700,
    left: HEADING_RIGHT.left,
    lineHeight: HEADING_RIGHT.lineHeight,
    position: 'absolute',
    width: HEADING_RIGHT.width,
  },
  highlight: { color: GREEN, textTransform: 'uppercase' },
  skillLabel: {
    alignItems: 'center',
    backgroundColor: GREEN,
    flexDirection: 'row',
    height: SKILL_LABEL.height,
    left: SKILL_LABEL.left,
    paddingLeft: SKILL_LABEL.paddingLeft,
    paddingRight: SKILL_LABEL.paddingRight,
    paddingTop: SKILL_LABEL.paddingTop,
    position: 'absolute',
  },
  skillName: {
    color: WHITE,
    fontSize: SKILL_NAME.size,
    fontWeight: 900,
    marginLeft: SKILL_NAME.marginLeft,
    textTransform: 'uppercase',
  },
  description: {
    left: SKILL_DESCRIPTION.left,
    lineHeight: SKILL_DESCRIPTION.lineHeight,
    maxLines: SKILL_DESCRIPTION.maxLines,
    position: 'absolute',
    textOverflow: 'ellipsis',
    width: SKILL_DESCRIPTION.width,
  },
  levelText: { color: LEVEL_GRAY, position: 'absolute', right: LEVEL_RIGHT, textAlign: 'right' },
  levelWord: { color: GREEN, fontWeight: 900, textTransform: 'lowercase' },
  emblem: { ...EMBLEM_BOX, position: 'absolute' },
})

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
  if (!iconNode) return null
  return (
    <Svg
      height={SKILL_ICON.height}
      style={{ marginTop: SKILL_ICON.offset }}
      viewBox="0 0 24 24"
      width={SKILL_ICON.width}
    >
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

interface RowLineSpec {
  flex: number
  lineHeight: number
  marginLeft: number
  marginRight: number
}

const RowLine = ({ spec, value }: { spec: RowLineSpec; value: string }) => (
  <View
    style={[
      styles.rowLine,
      {
        flexBasis: 0,
        flexGrow: spec.flex,
        marginLeft: spec.marginLeft,
        marginRight: spec.marginRight,
        minHeight: spec.lineHeight + ROW_LINE_WIDTH / 2,
      },
    ]}
  >
    <Text style={styles.rowValue}>{value}</Text>
  </View>
)

export const CertificateDocument = ({ data, labels }: CertificateDocumentProps) => {
  const { activity, holder, organization } = data
  const lastName = holder.lastName ?? ''
  const plan = taskPlan(activity.tasks, Boolean(organization.signatureUrl))
  const skills = data.skills.slice(0, SKILL_LABEL_TOPS.length)
  const bannerSize = titleSize(labels.title)

  return (
    <Document author="GloRe" title={`${labels.title}: ${holder.firstName} ${lastName}`.trim()}>
      <Page size={[PAGE_WIDTH, PAGE_HEIGHT]} style={styles.page}>
        <Svg
          height={ARROWS_BOX.height}
          style={[styles.absolute, { left: ARROWS_BOX.left, top: ARROWS_BOX.top }]}
          viewBox={`0 0 ${ARROWS_BOX.width} ${ARROWS_BOX.height}`}
          width={ARROWS_BOX.width}
        >
          {FADED_ARROWS.map(path => (
            <Path d={path.d} fill={path.fill} key={path.d.slice(0, 24)} />
          ))}
        </Svg>

        {/* Header */}
        <Svg
          height={LOGO_BOX.height}
          style={[styles.absolute, { left: LOGO_BOX.left, top: LOGO_BOX.top }]}
          viewBox={`0 0 ${LOGO_BOX.width} ${LOGO_BOX.height}`}
          width={LOGO_BOX.width}
        >
          {LOGO_PATHS.map(path => (
            <Path d={path.d} fill={path.fill} key={path.d.slice(0, 24)} />
          ))}
        </Svg>
        <View style={styles.banner}>
          <Text style={[styles.bannerText, { fontSize: bannerSize, letterSpacing: BANNER_TRACKING * bannerSize }]}>
            {labels.title}
          </Text>
        </View>
        <Text style={[styles.name, placed(NAME_BOX.firstTop, nameSize(holder.firstName))]}>{holder.firstName}</Text>
        <Text style={[styles.name, { fontWeight: 700 }, placed(NAME_BOX.lastTop, nameSize(lastName))]}>{lastName}</Text>

        {/* Personal */}
        <View style={[styles.bar, { backgroundColor: GREEN, height: PERSONAL.barHeight, top: PERSONAL.barTop }]} />
        <Text style={[styles.personalLine, placed(PERSONAL.tops[0]!, PERSONAL.size)]}>
          {`${labels.nationality} `}
          <Text style={styles.strong}>{holder.nationality ?? ''}</Text>
        </Text>
        <Text style={[styles.personalLine, placed(PERSONAL.tops[1]!, PERSONAL.size)]}>
          {`${labels.dateOfBirth} `}
          <Text style={styles.strong}>{formatDate(holder.birthday)}</Text>
        </Text>
        <Text style={[styles.personalLine, placed(PERSONAL.tops[2]!, PERSONAL.size)]}>
          {`${labels.placeOfBirth} `}
          <Text style={styles.strong}>{holder.birthPlace ?? ''}</Text>
        </Text>

        {/* Volunteering */}
        <View style={[styles.bar, { height: VOLUNTEERING.barHeight, top: VOLUNTEERING.barTop }]} />
        <Text style={[styles.heading, placed(VOLUNTEERING.headingTop, HEADING_SIZE)]}>{labels.volunteering}</Text>
        <View style={[styles.row, { left: VOLUNTEERING_LEFT, top: PERIOD_ROW.top, width: PERIOD_ROW.width }]}>
          <Text style={styles.rowLabel}>{labels.from}</Text>
          <RowLine spec={PERIOD_FROM} value={formatDate(activity.startDate)} />
          <Text style={styles.rowLabel}>{labels.to}</Text>
          <RowLine spec={PERIOD_TO} value={formatDate(activity.endDate)} />
        </View>
        <View style={[styles.row, { left: VOLUNTEERING_LEFT, top: HOURS_ROW.top, width: HOURS_ROW.width }]}>
          <Text style={styles.rowLabel}>{labels.hours}</Text>
          <RowLine spec={HOURS_ROW} value={activity.duration ? String(activity.duration) : ''} />
        </View>
        <View style={[styles.row, { left: VOLUNTEERING_LEFT, top: LOCATION_ROW.top, width: LOCATION_ROW.width }]}>
          <Text style={styles.rowLabel}>{labels.at}</Text>
          <RowLine spec={LOCATION_ROW} value={activity.location ?? ''} />
        </View>
        <Text style={[styles.absolute, { left: VOLUNTEERING_LEFT }, placed(PARTNERSHIP_TOP, 10)]}>
          {labels.partnership}
        </Text>
        <Text
          style={[
            styles.partnerName,
            { width: partnerWidth(organization.logoUrl) },
            placed(PARTNER_TOP, partnerFontSize(organization.name, partnerWidth(organization.logoUrl))),
          ]}
        >
          {organization.name}
        </Text>
        {organization.logoUrl ? <Image src={organization.logoUrl} style={styles.partnerLogo} /> : null}

        {/* Main tasks */}
        <View style={[styles.bar, { height: TASKS_SECTION.barHeight, top: TASKS_SECTION.barTop }]} />
        <Text style={[styles.heading, placed(TASKS_SECTION.headingTop, HEADING_SIZE)]}>{labels.mainTasks}</Text>
        <Text style={[styles.tasksIntro, placed(TASKS_SECTION.introTop, 10)]}>{labels.tasksIntro}</Text>
        {plan.flow ? (
          <View style={[styles.taskFlow, { top: placed(TASK_TOP, plan.size).top }]}>
            {plan.tasks.map(task => (
              <Text key={task} style={[styles.taskFlowItem, { fontSize: plan.size }]}>
                <Text style={styles.bullet}>{'• '}</Text>
                {task}
              </Text>
            ))}
          </View>
        ) : (
          plan.tasks.map((task, index) => (
            <Text key={task} style={[styles.task, placed(TASK_TOP + index * TASK_PITCH, 10)]}>
              <Text style={styles.bullet}>{'• '}</Text>
              {task}
            </Text>
          ))
        )}
        {organization.signatureUrl ? <Image src={organization.signatureUrl} style={styles.signatureImage} /> : null}
        <View style={[styles.row, { top: REPRESENTED_ROW.top, width: REPRESENTED_ROW.width }]}>
          <Text style={styles.rowLabel}>{labels.representedBy}</Text>
          <RowLine spec={REPRESENTED_ROW} value={organization.legalRepresentative ?? ''} />
        </View>
        <Text style={[styles.date, placed(DATE_TOP, DATE_SIZE)]}>{`${labels.date} ${formatDate(data.issuedAt)}`}</Text>

        {/* Verification */}
        {data.qrPath ? (
          <Svg height={QR_BOX.size} style={styles.qr} viewBox={`0 0 ${data.qrSize} ${data.qrSize}`} width={QR_BOX.size}>
            <Path d={data.qrPath} fill={NAVY} />
          </Svg>
        ) : null}
        {data.verifyUrl ? (
          <View style={styles.verify}>
            <Text>{labels.verify}</Text>
            <Text style={[styles.verifyCode, { fontSize: verifySize(data.verifyUrl) }]}>{data.verifyUrl}</Text>
          </View>
        ) : null}

        {/* Skills */}
        <Text style={[styles.headingRight, placed(HEADING_RIGHT.top, HEADING_RIGHT.size)]}>
          {labels.headingBefore}
          <Text style={styles.highlight}>{labels.headingHighlight}</Text>
          {labels.headingAfter}
        </Text>
        {skills.map((skill, index) => {
          const top = SKILL_LABEL_TOPS[index] ?? 0
          const { level, steps } = skillDots(skill)
          return (
            <View key={skill.name}>
              <View
                style={[
                  styles.skillLabel,
                  { paddingTop: SKILL_LABEL.paddingTop - (SKILL_LABEL_RAISE[index] ?? 0), top },
                ]}
              >
                <SkillIcon iconNode={skill.iconNode} />
                <Text
                  style={[
                    styles.skillName,
                    { fontSize: skillNameSize(skill.name), marginLeft: skill.iconNode ? SKILL_NAME.marginLeft : 0 },
                  ]}
                >
                  {skill.name}
                </Text>
              </View>
              {skill.description ? (
                <Text
                  style={[
                    styles.description,
                    placed(top + (SKILL_DESCRIPTION_OFFSETS[index] ?? 0), SKILL_DESCRIPTION.size),
                  ]}
                >
                  {skill.description}
                </Text>
              ) : null}
              <Svg
                height={DOT_SIZE}
                style={[styles.absolute, { left: DOT_LEFTS[0], top: top + (SKILL_DOT_OFFSETS[index] ?? 0) }]}
                width={DOT_LEFTS[4]! - DOT_LEFTS[0]! + DOT_SIZE}
              >
                {DOT_LEFTS.slice(0, steps).map((left, dot) => (
                  <Circle
                    cx={left - DOT_LEFTS[0]! + DOT_SIZE / 2}
                    cy={DOT_SIZE / 2}
                    fill={dot < level ? GREEN : GRAY}
                    key={left}
                    r={DOT_SIZE / 2}
                  />
                ))}
              </Svg>
              {level > 0 ? (
                <Text style={[styles.levelText, placed(top + (SKILL_LEVEL_OFFSETS[index] ?? 0), LEVEL_SIZE)]}>
                  {labels.level}
                  <Text style={{ letterSpacing: LEVEL_SPACE_TRACKING }}> </Text>
                  <Text style={styles.levelWord}>{skill.levelLabel ?? labels.levels[level - 1] ?? ''}</Text>
                </Text>
              ) : null}
            </View>
          )
        })}

        {/* Footer */}
        <Image src={assetSource(EMBLEM_SRC)} style={styles.emblem} />
      </Page>
    </Document>
  )
}
