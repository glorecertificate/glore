'use client'

import { NuqsAdapter } from 'nuqs/adapters/next/app'

export const SearchParamsProvider = (props: React.ComponentProps<typeof NuqsAdapter>) => (
  <NuqsAdapter
    processUrlSearchParams={search => {
      search.sort()
      return search
    }}
    {...props}
  />
)
