'use client'

import dynamic from 'next/dynamic'

const loadMarkdown = () => import('@/components/ui/markdown')

export const preloadMarkdown = () => loadMarkdown()

export const MarkdownLazy = dynamic(loadMarkdown, { loading: () => null })
