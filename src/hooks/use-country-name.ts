'use client'

import { useMessages } from 'next-intl'

import { countryName } from '@/lib/country'

export const useCountryName = () => {
  const { Countries } = useMessages().Intl
  return (code: string) => countryName(Countries, code)
}
