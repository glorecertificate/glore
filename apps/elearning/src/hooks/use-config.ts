'use client'

import { useMemo } from 'react'

import { minSkillRating, minSkills } from 'config/app.json'

export const useConfig = () =>
  useMemo(
    () =>
      ({
        minSkills,
        minSkillRating,
      }) as const,
    [],
  )
