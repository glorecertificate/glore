import { connection } from 'next/server'
import { Suspense } from 'react'

const Connection = async () => {
  await connection()
  return null
}

export const DynamicMarker = () => (
  <Suspense>
    <Connection />
  </Suspense>
)
