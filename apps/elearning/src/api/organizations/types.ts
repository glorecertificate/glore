import { type getOrganization } from '@/api/organizations/requests'

export type Organization = Awaited<ReturnType<typeof getOrganization>>
