'use client'

import { useEffect, useState } from 'react'

import { useLocale, useTranslations } from 'next-intl'

import { fetchCertificateLabels } from '@/actions/certificates/preview'
import {
  ARROWS_BOX,
  BANNER,
  BANNER_BOX,
  BANNER_TRACKING,
  type CertificateInput,
  type CertificatePdfLabels,
  DATE_SIZE,
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
  REPRESENTED_ROW,
  ROBOTO_LINE_HEIGHT,
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
  TASK_LEFT,
  TASK_LINE_HEIGHT,
  TASK_TOP,
  TASK_WIDTH,
  VOLUNTEERING,
  VOLUNTEERING_LEFT,
  WHITE,
  baselineTop,
  dateTop,
  formatDate,
  nameSize,
  partnerFontSize,
  partnerWidth,
  representedTop,
  skillDots,
  skillNameSize,
  softHyphenate,
  taskPlan,
  titleSize,
} from '@/components/features/certificates/certificate-layout'
import { LOGO_PATHS } from '@/components/features/certificates/pdf-assets'
import { pdfLabels } from '@/components/features/certificates/pdf-helpers'
import { LucideIcon } from '@/components/icons/lucide'
import { Image } from '@/components/ui/image'
import { SKILL_LEVELS } from '@/db/queries/skill-level-description'
import { type IconName } from '@/lib/types'
import { cn } from '@/lib/utils'

const unit = (points: number) => `${(points / PAGE_WIDTH) * 100}cqw`

const spot = (left: number, top: number, extra?: React.CSSProperties): React.CSSProperties => ({
  left: unit(left),
  position: 'absolute',
  top: unit(top),
  ...extra,
})

const textAt = (
  left: number,
  top: number,
  size: number,
  lineHeight: number,
  extra?: React.CSSProperties
): React.CSSProperties =>
  spot(left, baselineTop(top, size, lineHeight), {
    fontSize: unit(size),
    lineHeight,
    margin: 0,
    ...extra,
  })

const PAGE_STYLE = {
  aspectRatio: `${PAGE_WIDTH} / ${PAGE_HEIGHT}`,
  color: NAVY,
  fontFamily: "'Certificate Roboto', Roboto, sans-serif",
  fontKerning: 'normal',
  fontWeight: 400,
} as React.CSSProperties

const Bar = ({ color = NAVY, height, top }: { color?: string; height: number; top: number }) => (
  <div
    style={spot(SECTION_BAR.left, top, {
      backgroundColor: color,
      height: unit(height),
      width: unit(SECTION_BAR.width),
    })}
  />
)

interface RowLineSpec {
  flex: number
  lineHeight: number
  marginLeft: number
  marginRight: number
}

const RowLine = ({ spec, value }: { spec: RowLineSpec; value: string }) => (
  <div
    style={{
      borderBottom: `${unit(ROW_LINE_WIDTH)} solid ${NAVY}`,
      boxSizing: 'content-box',
      flex: `${spec.flex} 1 0`,
      height: unit(spec.lineHeight - ROW_LINE_WIDTH / 2),
      marginLeft: unit(spec.marginLeft),
      marginRight: unit(spec.marginRight),
      minWidth: 0,
      paddingLeft: unit(ROW_LINE_PADDING),
    }}
  >
    <p
      className="truncate"
      style={{
        fontSize: unit(10),
        fontWeight: 700,
        lineHeight: ROBOTO_LINE_HEIGHT,
        margin: 0,
        position: 'relative',
        top: unit(ROW_VALUE_TOP),
      }}
    >
      {value}
    </p>
  </div>
)

const RowLabel = ({ children }: { children: string }) => (
  <p
    style={{
      fontSize: unit(10),
      lineHeight: 1,
      margin: `${unit(baselineTop(0, 10, 1))} 0 0`,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </p>
)

const Row = ({
  children,
  left = ROW_LEFT,
  top,
  width,
}: {
  children: React.ReactNode
  left?: number
  top: number
  width: number
}) => <div style={spot(left, top, { alignItems: 'flex-start', display: 'flex', width: unit(width) })}>{children}</div>

const ICON_BOX: React.CSSProperties = {
  display: 'block',
  height: unit(SKILL_ICON.height),
  marginTop: unit(SKILL_ICON.offset),
  width: unit(SKILL_ICON.width),
}

const SkillIcon = ({ icon }: { icon: string | null }) => {
  if (!icon) return null
  return (
    <span style={ICON_BOX}>
      <LucideIcon
        aria-hidden
        name={icon as IconName}
        style={{ color: WHITE, display: 'block', height: unit(SKILL_ICON.height), width: unit(SKILL_ICON.height) }}
      />
    </span>
  )
}

export const CertificatePage = ({
  className,
  input,
  label,
  labels: frozenLabels,
  language,
  ...props
}: Omit<React.ComponentProps<'figure'>, 'children'> & {
  input: CertificateInput
  label: string
  labels?: CertificatePdfLabels
  language?: string
}) => {
  const t = useTranslations('CertificatePdf')
  const common = useTranslations('Common')
  const locale = useLocale()
  const [remote, setRemote] = useState<{ labels: CertificatePdfLabels; language: string } | null>(null)
  const foreign = Boolean(language && language !== locale && !frozenLabels)

  useEffect(() => {
    if (!(foreign && language)) return
    let active = true
    const load = async () => {
      try {
        const labels = await fetchCertificateLabels(language)
        if (active) setRemote({ labels, language })
      } catch {
        if (active) setRemote(null)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [foreign, language])

  const labels =
    frozenLabels ??
    (foreign && remote && remote.language === language ? remote.labels : null) ??
    pdfLabels(
      key => t(key),
      SKILL_LEVELS.map(level => common(`skillLevels.${level}`))
    )
  const { activity, holder, organization } = input
  const lastName = holder.lastName ?? ''
  const plan = taskPlan(activity.tasks, Boolean(organization.signatureUrl))
  const skills = input.skills.slice(0, SKILL_LABEL_TOPS.length)
  const bannerSize = titleSize(labels.title)
  const partnerSpan = partnerWidth(organization.logoUrl)
  const partnerSize = partnerFontSize(organization.name, partnerSpan)

  return (
    <figure
      className={cn(
        '@container relative w-full overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-border',
        className
      )}
      data-slot="certificate-page"
      style={PAGE_STYLE}
      {...props}
    >
      <figcaption className="sr-only">{label}</figcaption>
      <div aria-hidden className="absolute inset-0 select-none">
        <svg
          style={spot(ARROWS_BOX.left, ARROWS_BOX.top, {
            height: unit(ARROWS_BOX.height),
            width: unit(ARROWS_BOX.width),
          })}
          viewBox={`0 0 ${ARROWS_BOX.width} ${ARROWS_BOX.height}`}
        >
          {FADED_ARROWS.map(path => (
            <path d={path.d} fill={path.fill} key={path.d.slice(0, 24)} />
          ))}
        </svg>
        <svg
          style={spot(LOGO_BOX.left, LOGO_BOX.top, { height: unit(LOGO_BOX.height), width: unit(LOGO_BOX.width) })}
          viewBox={`0 0 ${LOGO_BOX.width} ${LOGO_BOX.height}`}
        >
          {LOGO_PATHS.map(path => (
            <path d={path.d} fill={path.fill} key={path.d.slice(0, 24)} />
          ))}
        </svg>

        <div
          style={spot(BANNER_BOX.left, BANNER_BOX.top, {
            alignItems: 'center',
            backgroundColor: BANNER,
            display: 'flex',
            height: unit(BANNER_BOX.height),
            minWidth: unit(BANNER_BOX.minWidth),
            paddingLeft: unit(BANNER_BOX.paddingHorizontal),
            paddingRight: unit(BANNER_BOX.paddingHorizontal),
            paddingTop: unit(BANNER_BOX.paddingTop),
          })}
        >
          <p
            style={{
              color: WHITE,
              fontSize: unit(bannerSize),
              letterSpacing: unit(BANNER_TRACKING * bannerSize),
              lineHeight: 1,
              margin: 0,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {labels.title}
          </p>
        </div>
        <p
          style={textAt(NAME_BOX.left, NAME_BOX.firstTop, nameSize(holder.firstName), 1, {
            color: NAME_COLOR,
            whiteSpace: 'nowrap',
            width: unit(NAME_BOX.width),
          })}
        >
          {holder.firstName}
        </p>
        <p
          style={textAt(NAME_BOX.left, NAME_BOX.lastTop, nameSize(lastName), 1, {
            color: NAME_COLOR,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            width: unit(NAME_BOX.width),
          })}
        >
          {lastName}
        </p>

        <Bar color={GREEN} height={PERSONAL.barHeight} top={PERSONAL.barTop} />
        {[
          [labels.nationality, holder.nationality ?? ''],
          [labels.dateOfBirth, formatDate(holder.birthday)],
          [labels.placeOfBirth, holder.birthPlace ?? ''],
        ].map(([name, value], index) => (
          <p key={name} style={textAt(PERSONAL.left, PERSONAL.tops[index]!, PERSONAL.size, 1, { whiteSpace: 'pre' })}>
            {`${name} `}
            <span style={{ fontWeight: 900, textTransform: 'uppercase' }}>{value}</span>
          </p>
        ))}

        <Bar height={VOLUNTEERING.barHeight} top={VOLUNTEERING.barTop} />
        <p
          style={textAt(HEADING_LEFT, VOLUNTEERING.headingTop, HEADING_SIZE, 1, {
            fontWeight: 900,
            letterSpacing: unit(HEADING_TRACKING),
            textTransform: 'uppercase',
          })}
        >
          {labels.volunteering}
        </p>
        <Row left={VOLUNTEERING_LEFT} top={PERIOD_ROW.top} width={PERIOD_ROW.width}>
          <RowLabel>{labels.from}</RowLabel>
          <RowLine spec={PERIOD_FROM} value={formatDate(activity.startDate)} />
          <RowLabel>{labels.to}</RowLabel>
          <RowLine spec={PERIOD_TO} value={formatDate(activity.endDate)} />
        </Row>
        <Row left={VOLUNTEERING_LEFT} top={HOURS_ROW.top} width={HOURS_ROW.width}>
          <RowLabel>{labels.hours}</RowLabel>
          <RowLine spec={HOURS_ROW} value={activity.duration ? String(activity.duration) : ''} />
        </Row>
        <Row left={VOLUNTEERING_LEFT} top={LOCATION_ROW.top} width={LOCATION_ROW.width}>
          <RowLabel>{labels.at}</RowLabel>
          <RowLine spec={LOCATION_ROW} value={activity.location ?? ''} />
        </Row>
        <p style={textAt(VOLUNTEERING_LEFT, PARTNERSHIP_TOP, 10, 1, { whiteSpace: 'nowrap' })}>{labels.partnership}</p>
        <p
          style={textAt(PARTNER_LEFT, PARTNER_TOP, partnerSize, PARTNER_LINE_HEIGHT, {
            fontWeight: 900,
            overflowWrap: 'anywhere',
            width: unit(partnerSpan),
          })}
        >
          {softHyphenate(organization.name)}
        </p>
        {organization.logoUrl ? (
          <Image
            alt=""
            height={64}
            src={organization.logoUrl}
            style={spot(PARTNER_LOGO.left, PARTNER_LOGO.top, {
              height: unit(PARTNER_LOGO.height),
              objectFit: 'contain',
              width: unit(PARTNER_LOGO.width),
            })}
            unoptimized
            width={64}
          />
        ) : null}

        <Bar height={TASKS_SECTION.barHeight} top={TASKS_SECTION.barTop} />
        <p
          style={textAt(HEADING_LEFT, TASKS_SECTION.headingTop, HEADING_SIZE, 1, {
            fontWeight: 900,
            letterSpacing: unit(HEADING_TRACKING),
            textTransform: 'uppercase',
          })}
        >
          {labels.mainTasks}
        </p>
        <p
          style={textAt(TASK_LEFT, TASKS_SECTION.introTop, 10, TASKS_INTRO_LINE_HEIGHT, {
            width: unit(TASKS_INTRO_WIDTH),
          })}
        >
          {labels.tasksIntro}
        </p>
        <div
          style={textAt(TASK_LEFT, TASK_TOP, plan.size, TASK_LINE_HEIGHT, {
            display: 'flex',
            flexDirection: 'column',
            rowGap: unit(plan.gap),
            width: unit(TASK_WIDTH),
          })}
        >
          {plan.tasks.map(task => (
            <p key={task} style={{ margin: 0, overflowWrap: 'anywhere' }}>
              <span style={{ color: GREEN, fontWeight: 900 }}>{'• '}</span>
              {softHyphenate(task)}
            </p>
          ))}
        </div>
        <Row top={representedTop(Boolean(organization.signatureUrl))} width={REPRESENTED_ROW.width}>
          <RowLabel>{labels.representedBy}</RowLabel>
          <RowLine spec={REPRESENTED_ROW} value={organization.legalRepresentative ?? ''} />
        </Row>
        {organization.signatureUrl ? (
          <Image
            alt=""
            height={64}
            src={organization.signatureUrl}
            style={spot(SIGNATURE_BOX.left, SIGNATURE_BOX.top, {
              height: unit(SIGNATURE_BOX.height),
              objectFit: 'contain',
              objectPosition: 'left center',
              width: unit(SIGNATURE_BOX.width),
            })}
            unoptimized
            width={64}
          />
        ) : null}
        <p
          style={textAt(HEADING_LEFT, dateTop(Boolean(organization.signatureUrl)), DATE_SIZE, 1, {
            fontWeight: 900,
            textTransform: 'uppercase',
            whiteSpace: 'pre',
          })}
        >
          {`${labels.date} ${formatDate(input.issuedAt)}`}
        </p>

        <p
          style={textAt(HEADING_RIGHT.left, HEADING_RIGHT.top, HEADING_RIGHT.size, HEADING_RIGHT.lineHeight, {
            fontWeight: 700,
            width: unit(HEADING_RIGHT.width),
          })}
        >
          {labels.headingBefore}
          <span style={{ color: GREEN, textTransform: 'uppercase' }}>{labels.headingHighlight}</span>
          {labels.headingAfter}
        </p>
        {skills.map((skill, index) => {
          const top = SKILL_LABEL_TOPS[index] ?? 0
          const { level, steps } = skillDots(skill)
          return (
            <div key={skill.name}>
              <div
                style={spot(SKILL_LABEL.left, top, {
                  alignItems: 'center',
                  backgroundColor: GREEN,
                  display: 'flex',
                  height: unit(SKILL_LABEL.height),
                  paddingLeft: unit(SKILL_LABEL.paddingLeft),
                  paddingRight: unit(SKILL_LABEL.paddingRight),
                  paddingTop: unit(SKILL_LABEL.paddingTop - (SKILL_LABEL_RAISE[index] ?? 0)),
                })}
              >
                <SkillIcon icon={skill.icon} />
                <p
                  style={{
                    color: WHITE,
                    fontSize: unit(skillNameSize(skill.name)),
                    fontWeight: 900,
                    lineHeight: ROBOTO_LINE_HEIGHT,
                    margin: 0,
                    marginLeft: skill.icon ? unit(SKILL_NAME.marginLeft) : 0,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {skill.name}
                </p>
              </div>
              {skill.description ? (
                <p
                  style={textAt(
                    SKILL_DESCRIPTION.left,
                    top + (SKILL_DESCRIPTION_OFFSETS[index] ?? 0),
                    SKILL_DESCRIPTION.size,
                    SKILL_DESCRIPTION.lineHeight,
                    {
                      display: '-webkit-box',
                      overflow: 'hidden',
                      WebkitBoxOrient: 'vertical',
                      overflowWrap: 'anywhere',
                      whiteSpace: 'pre-line',
                      WebkitLineClamp: SKILL_DESCRIPTION.maxLines,
                      width: unit(SKILL_DESCRIPTION.width),
                    }
                  )}
                >
                  {softHyphenate(skill.description)}
                </p>
              ) : null}
              <div style={spot(DOT_LEFTS[0]!, top + (SKILL_DOT_OFFSETS[index] ?? 0))}>
                {DOT_LEFTS.slice(0, steps).map((left, dot) => (
                  <span
                    key={left}
                    style={spot(left - DOT_LEFTS[0]!, 0, {
                      backgroundColor: dot < level ? GREEN : GRAY,
                      borderRadius: '50%',
                      height: unit(DOT_SIZE),
                      width: unit(DOT_SIZE),
                    })}
                  />
                ))}
              </div>
              {level > 0 ? (
                <p
                  style={textAt(0, top + (SKILL_LEVEL_OFFSETS[index] ?? 0), LEVEL_SIZE, 1, {
                    color: LEVEL_GRAY,
                    left: 'auto',
                    right: unit(LEVEL_RIGHT),
                    textAlign: 'right',
                    whiteSpace: 'pre',
                  })}
                >
                  {labels.level}
                  <span style={{ letterSpacing: unit(LEVEL_SPACE_TRACKING) }}> </span>
                  <span style={{ color: GREEN, fontWeight: 900, textTransform: 'lowercase' }}>
                    {skill.levelLabel ?? labels.levels[level - 1] ?? ''}
                  </span>
                </p>
              ) : null}
            </div>
          )
        })}

        <Image
          alt=""
          height={118}
          src={EMBLEM_SRC}
          style={spot(EMBLEM_BOX.left, EMBLEM_BOX.top, {
            height: unit(EMBLEM_BOX.height),
            width: unit(EMBLEM_BOX.width),
          })}
          unoptimized
          width={519}
        />
      </div>
    </figure>
  )
}
