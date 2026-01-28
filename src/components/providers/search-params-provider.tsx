'use client'

import { NuqsAdapter } from 'nuqs/adapters/next'

export const SearchParamsProvider = (props: React.ComponentProps<typeof NuqsAdapter>) => (
  <NuqsAdapter
    processUrlSearchParams={search => {
      search.sort()
      return search
    }}
    {...props}
  />
)
