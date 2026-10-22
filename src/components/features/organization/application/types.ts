import { type UseFormReturn } from 'react-hook-form'

import { type ApplicationInput } from '@/db/queries/organization-application'

export type ApplicationForm = UseFormReturn<ApplicationInput>
