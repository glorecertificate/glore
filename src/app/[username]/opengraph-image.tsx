import { ImageResponse } from 'next/og'
import { type CSSProperties } from 'react'

import { findPublicCertificate } from '@/actions/certificates/queries'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const wrapperStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  backgroundColor: '#0f766e',
  padding: '56px 72px',
  fontFamily: 'system-ui, sans-serif',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const logoStyle: CSSProperties = {
  fontSize: 26,
  fontWeight: 700,
  color: '#ffffff',
  letterSpacing: '-0.3px',
}

const badgeStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  backgroundColor: 'rgba(255,255,255,0.2)',
  borderRadius: 20,
  padding: '8px 18px',
  fontSize: 15,
  fontWeight: 600,
  color: '#ffffff',
}

const contentStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}

const nameStyle: CSSProperties = {
  fontWeight: 800,
  color: '#ffffff',
  lineHeight: 1.05,
  letterSpacing: '-1.5px',
}

const orgStyle: CSSProperties = {
  fontSize: 26,
  color: 'rgba(255,255,255,0.75)',
  fontWeight: 500,
}

const skillsRowStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  marginTop: 4,
  flexWrap: 'wrap',
}

const skillPillStyle: CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.18)',
  borderRadius: 8,
  padding: '7px 16px',
  fontSize: 16,
  color: '#ffffff',
}

const footerStyle: CSSProperties = {
  fontSize: 18,
  color: 'rgba(255,255,255,0.55)',
}

export default async ({ params }: { params: Promise<{ username: string }> }) => {
  const { username } = await params
  const { data } = await findPublicCertificate(username)
  const { user, organization, skills = [] } = data ?? {}

  const volunteerName = user ? `${user.firstName} ${user.lastName}` : username
  const skillList = skills.slice(0, 4).map(({ course }) => {
    const title = course.title
    return title ? (title.en ?? Object.values(title)[0] ?? course.slug) : course.slug
  })

  return new ImageResponse(
    <div style={wrapperStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={logoStyle}>GloRe Certificate</span>
        <span style={badgeStyle}>✓ Verified</span>
      </div>
      {/* Content */}
      <div style={contentStyle}>
        <div style={{ ...nameStyle, fontSize: volunteerName.length > 20 ? 56 : 68 }}>{volunteerName}</div>
        {organization?.name && <div style={orgStyle}>{organization.name}</div>}
        {skillList.length > 0 && (
          <div style={skillsRowStyle}>
            {skillList.map((skill, i) => (
              <span key={i} style={skillPillStyle}>
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
      {/* Footer */}
      <div style={footerStyle}>{process.env.APP_URL.replace(/(https?:\/\/)/, '')}</div>
    </div>,
    { width: 1200, height: 630 }
  )
}
