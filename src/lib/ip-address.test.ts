import { describe, expect, it } from 'vitest'

import { formatIpAddress } from '@/lib/ip-address'

describe('formatIpAddress', () => {
  it('compresses the IPv6 unspecified address', () => {
    expect(formatIpAddress('0000:0000:0000:0000:0000:0000:0000:0000')).toBe('::')
  })

  it('compresses the IPv6 loopback address', () => {
    expect(formatIpAddress('0000:0000:0000:0000:0000:0000:0000:0001')).toBe('::1')
    expect(formatIpAddress('::1')).toBe('::1')
  })

  it('strips leading zeros and compresses the longest zero run', () => {
    expect(formatIpAddress('2001:0db8:0000:0000:0000:0000:0000:0001')).toBe('2001:db8::1')
    expect(formatIpAddress('2001:0db8:0000:0001:0000:0000:0000:0001')).toBe('2001:db8:0:1::1')
    expect(formatIpAddress('fe80:0:0:0:1:0:0:0')).toBe('fe80::1:0:0:0')
  })

  it('does not compress a single zero group', () => {
    expect(formatIpAddress('2001:db8:0:1:2:3:4:5')).toBe('2001:db8:0:1:2:3:4:5')
  })

  it('expands and recompresses addresses that already use ::', () => {
    expect(formatIpAddress('2001:DB8::0001')).toBe('2001:db8::1')
    expect(formatIpAddress('::')).toBe('::')
  })

  it('unwraps IPv4-mapped addresses and keeps IPv4 unchanged', () => {
    expect(formatIpAddress('::ffff:203.0.113.7')).toBe('203.0.113.7')
    expect(formatIpAddress('203.0.113.7')).toBe('203.0.113.7')
  })

  it('drops the zone id and returns malformed input unchanged', () => {
    expect(formatIpAddress('fe80::1%en0')).toBe('fe80::1')
    expect(formatIpAddress('not:an:ip')).toBe('not:an:ip')
    expect(formatIpAddress('1:2:3')).toBe('1:2:3')
  })
})
