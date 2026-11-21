import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import type { ReactNode } from 'react'

interface IconActionButtonProps {
  // What the button does. It is the tooltip and the name read by screen readers.
  label: string
  icon: ReactNode
  // A number shown next to the icon (stars, saves, shares). The screen reader hears it after the label.
  count?: number
  // For a toggle: true while it is switched on (the button gets the blue selected look).
  pressed?: boolean
  loading?: boolean
  disabled?: boolean
  // "outlined" has a border and is for toggles with a count; "text" has no border and is for plain actions.
  variant?: 'outlined' | 'text'
  tone?: 'default' | 'danger'
  onClick: () => void
}

// A button that shows an icon (and maybe a count) instead of a word. The word is in the tooltip.
export const IconActionButton = ({
  label,
  icon,
  count,
  pressed,
  loading = false,
  disabled = false,
  variant = 'outlined',
  tone = 'default',
  onClick,
}: IconActionButtonProps) => {
  const isPressed = pressed === true
  const accessibleName = count === undefined ? label : `${label}: ${count}`
  const quietColor = tone === 'danger' ? 'error.main' : 'text.secondary'
  const hoverColor = tone === 'danger' ? 'error.main' : 'primary.main'

  const lookSx = variant === 'outlined' && isPressed
    ? { bgcolor: 'primary.light', borderColor: 'var(--color-primary-border)', color: 'primary.main', '&:hover': { bgcolor: 'primary.light', borderColor: 'primary.main' } }
    : variant === 'outlined'
      ? { borderColor: 'divider', color: quietColor, '&:hover': { borderColor: 'var(--color-primary-border)', bgcolor: 'var(--color-subtle)', color: hoverColor } }
      : { color: quietColor, '&:hover': { bgcolor: 'var(--color-hover)', color: hoverColor } }

  return (
    <Tooltip arrow title={label}>
      {/* The span keeps the tooltip working while the button is disabled or busy. */}
      <span style={{ display: 'inline-flex' }}>
        <Button
          aria-busy={loading || undefined}
          aria-label={accessibleName}
          aria-pressed={pressed}
          disabled={disabled || loading}
          onClick={onClick}
          sx={{
            minWidth: 36,
            height: 36,
            px: count === undefined ? 1 : 1.25,
            gap: 0.75,
            ...lookSx,
            // While it saves, the button keeps its look (only a little lighter) so the icon does not jump.
            ...(loading && { '&.Mui-disabled': { ...lookSx, opacity: 0.6 } }),
          }}
          type="button"
          variant={variant}
        >
          {icon}
          {count !== undefined && (
            <span aria-hidden="true" style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.8125rem' }}>{count}</span>
          )}
        </Button>
      </span>
    </Tooltip>
  )
}
