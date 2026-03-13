import { intlMetadata } from '@/lib/metadata'

export const metadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'certificates',
  })

export default ({ children }: LayoutProps<'/certificates'>) => children
