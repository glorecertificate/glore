import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'certificates',
  })

export default ({ children }: LayoutProps<'/certificates'>) => children
