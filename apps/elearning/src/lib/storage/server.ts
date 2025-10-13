'use server'

import { cookies } from 'next/headers'

import { defineServerCookies } from '@glore/utils/cookies'

import { COOKIES_CONFIG, type Cookies } from '@/lib/storage'

export const serverCookies = defineServerCookies<Cookies>(cookies, COOKIES_CONFIG)
