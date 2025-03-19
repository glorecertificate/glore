import { ModulesView } from '@/components/modules/modules-view'
import { metadataFn } from '@/lib/metadata'

export default () => <ModulesView />

export const generateMetadata = metadataFn({
  title: 'Navigation.modules',
})
