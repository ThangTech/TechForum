import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { useEffect, useState } from 'react'
import { ArrowUpIcon } from '../common/ActionIcons'

const SHOW_AFTER_PX = 480

// A round button at the bottom right that takes the visitor back to the top of a long page.
// It only shows after some scrolling.
export const BackToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const update = () => setIsVisible(window.scrollY > SHOW_AFTER_PX)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  if (!isVisible) return null

  return (
    <Tooltip arrow placement="left" title="Lên đầu trang">
      <IconButton
        aria-label="Lên đầu trang"
        onClick={() => window.scrollTo({ top: 0 })}
        sx={{
          position: 'fixed',
          right: { xs: 16, md: 24 },
          bottom: { xs: 16, md: 24 },
          zIndex: 1000,
          width: 44,
          height: 44,
          borderRadius: '8px',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          boxShadow: '0 4px 14px rgba(16, 24, 40, 0.25)',
          '&:hover': { bgcolor: 'primary.dark' },
        }}
      >
        <ArrowUpIcon size={22} />
      </IconButton>
    </Tooltip>
  )
}
