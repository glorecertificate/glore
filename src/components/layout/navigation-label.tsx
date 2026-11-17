'use client'

import { type NavigationId } from '@/components/layout/navigation'
import { useNavigationLabels } from '@/components/layout/use-navigation-labels'

export const NavigationLabel = ({ id }: { id: NavigationId }) => useNavigationLabels()[id]
