import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Skeleton from '@mui/material/Skeleton'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useEffect, useState, type ReactNode, type TouchEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Banner } from '../../api/banners'
import { toMediaUrl } from '../../api/media'
import { useBanners } from '../../queries/banners'
import { isInitialLoading } from '../../queries/status'
import { getSwipeDirection, isInternalLink, stepIndex } from './carouselLogic'

const AUTOPLAY_MS = 5000

const frameSx = { aspectRatio: '3 / 1', minHeight: 110, borderRadius: '8px' } as const

const arrowSx = (side: 'left' | 'right') => ({
  position: 'absolute',
  top: '50%',
  [side]: 10,
  transform: 'translateY(-50%)',
  width: 36,
  height: 36,
  color: '#fff',
  bgcolor: 'rgba(17, 24, 39, 0.45)',
  opacity: 0,
  transition: 'opacity 0.2s',
  '&:hover': { bgcolor: 'rgba(17, 24, 39, 0.7)' },
  // The arrows show when the pointer is over the slider or when one of them has the keyboard focus.
  '.banner-slider:hover &, &:focus-visible': { opacity: 1 },
}) as const

// A banner is a link when it has an address: inside the site with the router, to another site in a new tab.
const BannerLink = ({ banner, isCurrent, children }: { banner: Banner; isCurrent: boolean; children: ReactNode }) => {
  const sx = { display: 'block', width: '100%', height: '100%' } as const
  const tabIndex = isCurrent ? undefined : -1
  if (!banner.linkUrl) return <Box sx={sx}>{children}</Box>
  if (isInternalLink(banner.linkUrl)) {
    return <Box component={Link} sx={sx} tabIndex={tabIndex} to={banner.linkUrl}>{children}</Box>
  }
  return <Box component="a" href={banner.linkUrl} rel="noopener noreferrer" sx={sx} tabIndex={tabIndex} target="_blank">{children}</Box>
}

const Chevron = ({ direction }: { direction: 'left' | 'right' }) => (
  <svg aria-hidden="true" fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24" width="18">
    <path d={direction === 'left' ? 'm15 5-7 7 7 7' : 'm9 5 7 7-7 7'} />
  </svg>
)

const PauseIcon = () => (
  <svg aria-hidden="true" fill="currentColor" height="12" viewBox="0 0 24 24" width="12"><rect height="16" rx="1" width="5" x="5" y="4" /><rect height="16" rx="1" width="5" x="14" y="4" /></svg>
)

const PlayIcon = () => (
  <svg aria-hidden="true" fill="currentColor" height="12" viewBox="0 0 24 24" width="12"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z" /></svg>
)

// The pictures at the top of the home page. They change every 5 seconds, stop while the pointer is over
// them or a part of them has the keyboard focus, and the visitor can stop them with the pause button. When the
// system asks for less motion they still change, only without the sliding effect.
// Dots, arrows and a swipe on a touch screen move them by hand.
export const BannerSlider = () => {
  const bannersQuery = useBanners()
  const banners = bannersQuery.data ?? []
  const count = banners.length
  const [index, setIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  // Set by the pause button; unlike isPaused (pointer or keyboard focus) it stays until the visitor presses play.
  const [isStopped, setIsStopped] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  // The list can get shorter while the slider is shown (a banner is turned off).
  const current = count === 0 ? 0 : index % count

  // The slider keeps changing by itself even when the system asks for less motion: that setting only removes the
  // sliding effect below (many Windows computers have animations turned off, and the slider would never move).
  // The visitor can stop it with the pause button.
  useEffect(() => {
    if (count < 2 || isPaused || isStopped) return undefined
    const timer = window.setInterval(() => setIndex((value) => stepIndex(value, count, 1)), AUTOPLAY_MS)
    return () => window.clearInterval(timer)
  }, [count, isPaused, isStopped])

  const move = (step: number) => setIndex(stepIndex(current, count, step))

  const endTouch = (event: TouchEvent) => {
    if (touchStartX === null) return
    const direction = getSwipeDirection(touchStartX, event.changedTouches[0].clientX)
    setTouchStartX(null)
    // A swipe to the left shows the next slide.
    if (direction !== 0) move(-direction)
  }

  if (isInitialLoading(bannersQuery)) {
    return <Skeleton sx={{ ...frameSx, mb: 3 }} variant="rounded" width="100%" />
  }

  // Without banners (or when they cannot be loaded) the home page simply has no slider.
  if (count === 0) return null

  return (
    <Box
      aria-label="Banner nổi bật"
      aria-roledescription="carousel"
      className="banner-slider"
      onBlurCapture={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchEnd={endTouch}
      onTouchStart={(event) => setTouchStartX(event.touches[0].clientX)}
      role="region"
      sx={{ ...frameSx, position: 'relative', overflow: 'hidden', mb: 3, bgcolor: 'var(--color-loading)' }}
    >
      <Box
        aria-live={isPaused ? 'polite' : 'off'}
        sx={{
          display: 'flex',
          height: '100%',
          transform: `translateX(-${current * 100}%)`,
          transition: prefersReducedMotion ? 'none' : 'transform 0.5s ease',
        }}
      >
        {banners.map((banner, position) => (
          <Box
            aria-hidden={position !== current}
            aria-label={`${position + 1} / ${count}`}
            aria-roledescription="slide"
            key={banner.id}
            role="group"
            sx={{ flex: '0 0 100%', minWidth: 0 }}
          >
            <BannerLink banner={banner} isCurrent={position === current}>
              {/* The picture is placed over the slide, so its own size never changes the size of the slider:
                  it is always stretched to cover the frame and the extra part is cut. */}
              <Box sx={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                <Box
                  alt={banner.title}
                  component="img"
                  draggable={false}
                  loading={position === 0 ? 'eager' : 'lazy'}
                  src={toMediaUrl(banner.imageUrl)}
                  sx={{ position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            </BannerLink>
          </Box>
        ))}
      </Box>

      {count > 1 && (
        <>
          <IconButton aria-label="Banner trước" onClick={() => move(-1)} sx={arrowSx('left')}><Chevron direction="left" /></IconButton>
          <IconButton aria-label="Banner sau" onClick={() => move(1)} sx={arrowSx('right')}><Chevron direction="right" /></IconButton>
          <IconButton
            aria-label={isStopped ? 'Tiếp tục tự chuyển banner' : 'Tạm dừng tự chuyển banner'}
            onClick={() => setIsStopped((value) => !value)}
            sx={{ ...arrowSx('right'), top: 'auto', bottom: 6, right: 8, transform: 'none', width: 28, height: 28, opacity: isStopped ? 1 : 0 }}
          >
            {isStopped ? <PlayIcon /> : <PauseIcon />}
          </IconButton>
          <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 10, display: 'flex', justifyContent: 'center', gap: 0.75, pointerEvents: 'none', '& > *': { pointerEvents: 'auto' } }}>
            {banners.map((banner, position) => (
              <Box
                aria-current={position === current}
                aria-label={`Đến banner ${position + 1}: ${banner.title}`}
                component="button"
                key={banner.id}
                onClick={() => setIndex(position)}
                sx={{
                  width: position === current ? 28 : 18,
                  height: 4,
                  p: 0,
                  border: 0,
                  borderRadius: '2px',
                  cursor: 'pointer',
                  bgcolor: position === current ? '#fff' : 'rgba(255, 255, 255, 0.55)',
                  boxShadow: '0 0 2px rgba(0, 0, 0, 0.35)',
                  transition: 'width 0.2s, background-color 0.2s',
                }}
                type="button"
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  )
}
