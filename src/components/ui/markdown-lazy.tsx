'use client'

import dynamic from 'next/dynamic'

import { Spinner } from '@/components/ui/spinner'

export const MarkdownLazy = dynamic(() => import('@/components/ui/markdown'), {
  loading: () => <Spinner aria-hidden size="sm" />,
})
