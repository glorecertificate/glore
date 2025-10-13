import { type AnyRecord } from '@glore/utils/types'

/**
 * Icon component definition.
 */
export type Icon<T = AnyRecord> = (props: IconProps<T>) => React.ReactNode

/**
 * Icon component properties.
 */
export type IconProps<T = AnyRecord> = T extends never
  ? React.SVGProps<SVGSVGElement>
  : React.SVGProps<SVGSVGElement> & T
