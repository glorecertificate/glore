'use server'

import { cookies } from 'next/headers'

import { defineServerCookies } from '@glore/utils/cookies'

import { type Cookies, cookieStore } from '@/lib/storage'

export const serverCookies = defineServerCookies<Cookies>(cookies, cookieStore.config)
