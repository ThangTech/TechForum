// The slide that comes after moving `step` places (1 = next, -1 = previous) from `current`.
// It goes round: after the last slide comes the first one, and before the first one comes the last.
export const stepIndex = (current: number, count: number, step: number): number => {
  if (count <= 0) return 0
  return (((current + step) % count) + count) % count
}

// A link that stays inside the site starts with one "/" (not "//", which would be another site).
export const isInternalLink = (url: string): boolean => url.startsWith('/') && !url.startsWith('//')

// Which way a finger moved on the slider: -1 = to the left (next slide), 1 = to the right (previous slide),
// 0 = it only touched or moved too little to count as a swipe.
export const getSwipeDirection = (startX: number, endX: number, threshold = 40): -1 | 0 | 1 => {
  const distance = endX - startX
  if (Math.abs(distance) < threshold) return 0
  return distance < 0 ? -1 : 1
}
