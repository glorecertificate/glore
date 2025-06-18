'use client'

import { scan } from 'react-scan'

// React must be imported after react-scan
// eslint-disable-next-line perfectionist/sort-imports
import { useEffect } from 'react'

export const ReactScan = () => {
  useEffect(() => {
    scan({
      enabled: true,
    })
  }, [])

  return <></>
}
