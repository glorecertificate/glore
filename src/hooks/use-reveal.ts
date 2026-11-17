'use client'

import { useState } from 'react'

export const useReveal = (loading: boolean) => {
  const [waited, setWaited] = useState(loading)
  if (loading && !waited) setWaited(true)
  return waited && !loading
}
