import ButtonBase from '@mui/material/ButtonBase'
import Tooltip from '@mui/material/Tooltip'
import type { ReactNode } from 'react'

interface RailButtonProps {
  // What the button does: the name read by screen readers.
  label: string
  // The tooltip, when it should say more than the label (for example why the button is off).
  hint?: string
  icon: ReactNode
  // A small number at the top right of the circle; 0 is not shown.
  count?: number
  // For a toggle: true while it is switched on.
  pressed?: boolean
  // The colour when pressed: "up" is green (a good vote), "down" red, "default" the blue of the site.
  tone?: 'default' | 'up' | 'down'
  loading?: boolean
  disabled?: boolean
  onClick: () => void
}

// A round button of the action rail of a post (vote, answers, save, share, report). The look is in topicActionRail.css.
export const RailButton = ({ label, hint, icon, count, pressed, tone = 'default', loading = false, disabled = false, onClick }: RailButtonProps) => (
  <Tooltip arrow placement="right" title={hint ?? label}>
    {/* The span keeps the tooltip working while the button is disabled or busy. */}
    <span className="topic-rail__slot">
      <ButtonBase
        aria-busy={loading || undefined}
        aria-label={count === undefined ? label : `${label}: ${count}`}
        aria-pressed={pressed}
        className="topic-rail__button"
        data-pressed={pressed || undefined}
        data-tone={tone}
        disabled={disabled || loading}
        onClick={onClick}
        type="button"
      >
        {icon}
      </ButtonBase>
      {count !== undefined && count > 0 && <span aria-hidden="true" className="topic-rail__count">{count}</span>}
    </span>
  </Tooltip>
)
