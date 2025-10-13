import { Img, type ImgProps } from '@react-email/components'

import { assetUrl } from '@glore/mailer/utils'

export const Logo = ({ src, width = 60, ...props }: ImgProps) => (
  <Img src={src ?? assetUrl('logo.png')} width={width} {...props} />
)
