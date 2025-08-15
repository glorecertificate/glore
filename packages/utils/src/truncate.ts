export interface TruncateOptions {
  ellipsis?: string | boolean
}

export const TRUNCATE_SYMBOL = '…' as const
export const TRUNCATE_URL_REGEX = Object.freeze(
  /(((ftp|https?):\/\/)[-\w@:%_+.~#?,&//=]+)|((mailto:)?[_.\w-]{1,300}@(.{1,300}\.)[a-zA-Z]{2,3})/g,
)

/**
 * Truncate HTML string and keep tag safe.
 *
 * @method truncate
 * @param {String} string - String that needs to be truncated
 * @param {Number} maxLength - Length of truncated string
 * @param {Object} options (optional)
 * @param {Boolean|String} [options.ellipsis] Omission symbol for truncated string, "..." by default
 * @return {String} Truncated string
 */
export const truncate = (input: string, maxLength: number, options?: TruncateOptions): string => {
  const opts = options || {}
  opts.ellipsis = typeof opts.ellipsis === 'undefined' ? TRUNCATE_SYMBOL : opts.ellipsis

  if (!input || input.length === 0) return ''
  if (input.length <= maxLength) return input

  let content = ''
  let currentPosition = 0
  let match: RegExpExecArray | null

  const urlRegex = new RegExp(TRUNCATE_URL_REGEX.source, TRUNCATE_URL_REGEX.flags)

  while (currentPosition < input.length && content.length < maxLength) {
    urlRegex.lastIndex = currentPosition
    match = urlRegex.exec(input)

    if (!match || match.index >= maxLength) {
      const remainingSpace = maxLength - content.length
      content += input.substring(currentPosition, currentPosition + remainingSpace)
      break
    }

    const textBeforeUrl = input.substring(currentPosition, match.index)

    if (content.length + textBeforeUrl.length > maxLength) {
      const remainingSpace = maxLength - content.length
      content += textBeforeUrl.substring(0, remainingSpace)
      break
    }

    content += textBeforeUrl

    const url = match[0]

    if (content.length + url.length <= maxLength) {
      content += url
      currentPosition = match.index + url.length
    } else {
      const remainingSpace = maxLength - content.length
      content += url.substring(0, remainingSpace)
      break
    }
  }

  return addEllipsis(input, opts, content)
}

const addEllipsis = (input: string, options: TruncateOptions, content: string) => {
  const output = content.trim()
  if (content.length === input.length || !options.ellipsis) return output
  return output + (typeof options.ellipsis === 'string' ? options.ellipsis : TRUNCATE_SYMBOL)
}
