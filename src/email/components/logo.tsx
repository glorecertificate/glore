import { Img, type ImgProps } from '@react-email/components'

import { storageAsset } from '@/lib/storage'

export const EmailLogo = ({ src, width = 60, ...props }: ImgProps) => (
  <Img src={src ?? storageAsset('email/logo.png')} width={width} {...props} />
)
