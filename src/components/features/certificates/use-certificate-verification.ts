'use client'

import { useEffect, useState } from 'react'

import { certificateQr } from '@/components/features/certificates/certificate-layout'

interface Verification {
  code: string
  qrPath: string
  qrSize: number
  url: string
}

export const useCertificateVerification = (code: string | null) => {
  const [verification, setVerification] = useState<Verification | null>(null)

  useEffect(() => {
    if (!code) return
    let active = true
    const build = async () => {
      try {
        const { host, origin } = window.location
        const qr = await certificateQr(`${origin}/verify/${code}`)
        if (active) setVerification({ ...qr, code, url: `${host}/verify/${code}` })
      } catch {
        if (active) setVerification(null)
      }
    }
    void build()
    return () => {
      active = false
    }
  }, [code])

  return verification?.code === code ? verification : null
}
