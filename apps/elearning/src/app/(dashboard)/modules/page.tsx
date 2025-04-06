import { ModulesList } from '@/components/modules/modules-list'
import { generateAppMetadata } from '@/lib/metadata'

export default () => <ModulesList />

export const generateMetadata = generateAppMetadata({
  title: 'Navigation.modules',
})
