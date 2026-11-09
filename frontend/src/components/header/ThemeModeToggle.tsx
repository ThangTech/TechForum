import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { useThemeMode } from '../../theme/themeModeState'
import { MoonIcon, SunIcon } from '../common/ActionIcons'

// Switches the whole site between the light and the dark colours. It shows the mode that a click will give.
export const ThemeModeToggle = () => {
  const { mode, toggleMode } = useThemeMode()
  const label = mode === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'

  return (
    <Tooltip arrow title={label}>
      <IconButton
        aria-label={label}
        data-testid="theme-toggle"
        onClick={toggleMode}
        sx={{ width: 36, height: 36, color: 'text.secondary', '&:hover': { bgcolor: 'var(--color-hover)', color: 'primary.main' } }}
      >
        {mode === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
      </IconButton>
    </Tooltip>
  )
}
