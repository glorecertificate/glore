import 'server-only'

import { updateTag } from 'next/cache'

import { CacheTag } from '@/lib/cache'

export const expireMessageOverrides = () => updateTag(CacheTag.MessageOverrides)
