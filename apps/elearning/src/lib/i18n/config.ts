import { type Formats } from 'use-intl'

export const formats: Formats = {
  dateTime: {
    short: {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  },
  number: {
    precise: {
      maximumFractionDigits: 5,
    },
  },
  list: {
    enumeration: {
      style: 'long',
      type: 'conjunction',
    },
  },
}
