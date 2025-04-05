import { ModulesList } from '@/components/modules/modules-list'
import { metadataFn } from '@/lib/metadata'

export default () => <ModulesList />

export const generateMetadata = metadataFn({
  title: 'Navigation.modules',
})
