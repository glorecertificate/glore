import { Img, type ImgProps } from '@react-email/components'

import { storageFile } from '@/lib/storage'

export const EmailLogo = ({ src, width = 60, ...props }: ImgProps) => (
  <Img src={src ?? storageFile('/email/logo.png')} width={width} {...props} />
)
