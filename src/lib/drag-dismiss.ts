export const START_SLOP = 6

const DISMISS_RATIO = 0.25
const DISMISS_VELOCITY = 0.5

export const dragIntent = (dx: number, dy: number) => {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < START_SLOP) return 'pending'
  if (dy < 0 || Math.abs(dx) > dy) return 'cancel'
  return 'drag'
}

export const shouldDismiss = ({ delta, elapsed, height }: { delta: number; elapsed: number; height: number }) =>
  delta > height * DISMISS_RATIO || delta / Math.max(1, elapsed) > DISMISS_VELOCITY
