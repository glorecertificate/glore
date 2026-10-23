const GROUP_COUNT = 8
const GROUP = /^[0-9a-f]{1,4}$/iu
const IPV4_MAPPED = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/iu

const expand = (address: string) => {
  const halves = address.split('::')
  if (halves.length > 2) return null
  const head = halves[0] ? halves[0].split(':') : []
  const tail = halves[1] ? halves[1].split(':') : []
  const missing = GROUP_COUNT - head.length - tail.length
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null
  const groups = [...head, ...Array.from({ length: halves.length === 1 ? 0 : missing }, () => '0'), ...tail]
  if (!groups.every(group => GROUP.test(group))) return null
  return groups.map(group => Number.parseInt(group, 16))
}

const longestZeroRun = (groups: number[]) => {
  let best = { length: 0, start: -1 }
  let start = -1
  for (const [index, group] of [...groups, 1].entries()) {
    if (group === 0) {
      if (start === -1) start = index
      continue
    }
    if (start !== -1 && index - start > best.length) best = { length: index - start, start }
    start = -1
  }
  return best.length > 1 ? best : null
}

export const formatIpAddress = (value: string) => {
  const address = value.trim().split('%')[0]!
  if (!address.includes(':')) return address
  const mapped = IPV4_MAPPED.exec(address)
  if (mapped) return mapped[1]!
  const groups = expand(address)
  if (!groups) return address
  const run = longestZeroRun(groups)
  const hex = groups.map(group => group.toString(16))
  if (!run) return hex.join(':')
  const left = hex.slice(0, run.start).join(':')
  const right = hex.slice(run.start + run.length).join(':')
  return `${left}::${right}`
}
