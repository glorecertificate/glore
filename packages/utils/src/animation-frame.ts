import isServer from '@/is-server'

declare global {
  interface Window {
    mozCancelAnimationFrame?: (handle: number) => void
    mozRequestAnimationFrame?: (callback: FrameRequestCallback) => number
    msRequestAnimationFrame?: (callback: FrameRequestCallback) => number
    webkitRequestAnimationFrame?: (callback: FrameRequestCallback) => number
  }
}

/**
 * Returns the requestAnimationFrame function or undefined if running on the server.
 */
export const requestAnimationFrame = () => {
  if (isServer()) return undefined
  return (
    window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame
  )
}

/**
 * Returns the cancelAnimationFrame function or undefined if running on the server.
 */
export const cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame
