/**
 * Regular expression to match full hex color format (e.g. `#0033FF`).
 */
export const HEX_REGEX = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i

/**
 * Regular expression to match shorthand hex color format (e.g. `#03F`).
 */
export const SHORTHAND_HEX_REGEX = /^#?([a-f\d])([a-f\d])([a-f\d])$/i

/**
 * Converts a hex color string to an RGB object.
 * Supports shorthand (e.g. `#03F`) and full (e.g. `#0033FF`) hex formats, returning
 * an object with `r`, `g`, and `b` properties, or `null` if the input is invalid.
 */
export const hexToRgb = (hex: string) => {
  const color = hex.replace(SHORTHAND_HEX_REGEX, (_, r, g, b) => r + r + g + g + b + b)
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color)

  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}
