import { ImageResponse } from 'next/og'
import { type CSSProperties } from 'react'

import { verifyCertificate } from '@/actions/certificates/public'
import { normalizeCertificateCode } from '@/components/features/certificates/rules'
import { DEFAULT_LOCALE, localizeRecord } from '@/lib/i18n'
import { fullName } from '@/lib/utils'

export const size = { height: 630, width: 1200 }
export const contentType = 'image/png'

const wrapperStyle: CSSProperties = {
  backgroundColor: '#345372',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'system-ui, sans-serif',
  height: '100%',
  justifyContent: 'space-between',
  padding: '56px 72px',
  width: '100%',
}

const pillStyle: CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.18)',
  borderRadius: 8,
  color: '#ffffff',
  fontSize: 16,
  padding: '7px 16px',
}

const VerifyOpengraphImage = async ({ params }: { params: Promise<{ code: string }> }) => {
  const { code } = await params
  const normalized = normalizeCertificateCode(code)
  const result = normalized ? await verifyCertificate(normalized) : null
  if (result?.outcome === 'limited') return new Response(null, { headers: { 'retry-after': '60' }, status: 429 })
  const verification = result?.outcome === 'found' ? result : null
  const revoked = verification?.status === 'revoked'
  const name = verification ? fullName(verification.holder) : 'GloRe Certificate'
  const skills = (verification?.skills ?? [])
    .slice(0, 4)
    .map(skill => localizeRecord(skill.name, DEFAULT_LOCALE, DEFAULT_LOCALE))

  return new ImageResponse(
    <div style={wrapperStyle}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#ffffff', fontSize: 26, fontWeight: 700 }}>{'GloRe Certificate'}</span>
        {verification && (
          <span
            style={{
              backgroundColor: revoked ? '#b3261e' : '#7fbf73',
              borderRadius: 20,
              color: revoked ? '#ffffff' : '#1d3a2a',
              fontSize: 15,
              fontWeight: 600,
              padding: '8px 18px',
            }}
          >
            {revoked ? 'Revoked' : 'Verified'}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div
          style={{
            color: '#ffffff',
            fontSize: name.length > 20 ? 56 : 68,
            fontWeight: 800,
            letterSpacing: '-1.5px',
            lineHeight: 1.05,
          }}
        >
          {name}
        </div>
        {verification && (
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 26, fontWeight: 500 }}>
            {verification.organization.name}
          </div>
        )}
        {skills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
            {skills.map(skill => (
              <span key={skill} style={pillStyle}>
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 18 }}>
        {normalized ? `${process.env.APP_URL.replace(/(https?:\/\/)/u, '')}/verify/${normalized}` : ''}
      </div>
    </div>,
    size
  )
}

export default VerifyOpengraphImage
