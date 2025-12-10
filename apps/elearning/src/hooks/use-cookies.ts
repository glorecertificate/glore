'use client'

import { defineCookies } from '@glore/utils/cookies'

import { cookiesConfig } from '@/lib/storage'

/**
 * Returns a store for managing cookies on the client side.
 */
export const useCookies = () => defineCookies(cookiesConfig)
